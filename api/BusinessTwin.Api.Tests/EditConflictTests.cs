using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using BusinessTwin.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace BusinessTwin.Api.Tests;

/// <summary>
/// Two devices (or tabs) of the same owner edit the same thing. Each save sends the version it loaded; the second
/// save from an old version must be refused with 409 "edit-conflict" instead of silently overwriting the first.
/// </summary>
public class EditConflictTests(ApiFactory api) : IClassFixture<ApiFactory>
{
    private static object Baseline(string cashOnHand, int? version) => new
    {
        visitsPerMonth = "400", averagePrice = "38", costPerService = "5", staffHoursPerMonth = "480",
        serviceTimeHours = "1", wagesPerMonth = "9600", otherFixedCostsPerMonth = "2500", cashOnHand,
        sources = new Dictionary<string, string>(), version,
    };

    private static object Plan(string name, int? version) => new
    {
        name, horizonMonths = 12, status = "saved", version,
        changes = new[]
        {
            new
            {
                type = "marketing", startMonth = 1, costPerMonth = "300",
                newCustomersPerMonth = new { pessimistic = "5", expected = "10", optimistic = "15" },
            },
        },
    };

    private static async Task<JsonElement> Json(HttpResponseMessage response)
    {
        Assert.True(response.IsSuccessStatusCode, await response.Content.ReadAsStringAsync());
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private static async Task AssertEditConflict(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("edit-conflict", problem.GetProperty("code").GetString());
    }

    private async Task<(HttpClient Client, JsonElement Business, JsonElement Baseline)> OwnerWithBaselineAsync()
    {
        var client = await api.SignedInClientAsync($"{Guid.NewGuid():N}@example.test");
        var business = await Json(await client.PutAsJsonAsync("/api/business", new { name = "Salon Test", staffCount = 4 }));
        var baseline = await Json(await client.PutAsJsonAsync("/api/baseline", Baseline("2000", null)));
        return (client, business, baseline);
    }

    [Fact]
    public async Task A_save_from_an_old_version_of_the_baseline_is_refused()
    {
        var (client, _, baseline) = await OwnerWithBaselineAsync();
        var loaded = baseline.GetProperty("version").GetInt32();

        var laptop = await Json(await client.PutAsJsonAsync("/api/baseline", Baseline("3000", loaded)));
        Assert.Equal(loaded + 1, laptop.GetProperty("version").GetInt32());

        // The phone still has the version from before the laptop's save.
        await AssertEditConflict(await client.PutAsJsonAsync("/api/baseline", Baseline("1000", loaded)));
        var stored = await Json(await client.GetAsync("/api/baseline"));
        Assert.Equal(3000m, decimal.Parse(stored.GetProperty("cashOnHand").GetString()!, System.Globalization.CultureInfo.InvariantCulture));
    }

    [Fact]
    public async Task A_save_from_an_old_version_of_the_business_is_refused()
    {
        var (client, business, _) = await OwnerWithBaselineAsync();
        var loaded = business.GetProperty("version").GetInt32();

        await Json(await client.PutAsJsonAsync("/api/business", new { name = "Laptop", staffCount = 5, version = loaded }));
        await AssertEditConflict(await client.PutAsJsonAsync("/api/business", new { name = "Phone", staffCount = 6, version = loaded }));

        var stored = await Json(await client.GetAsync("/api/business"));
        Assert.Equal("Laptop", stored.GetProperty("name").GetString());
    }

    [Fact]
    public async Task A_save_from_an_old_version_of_a_plan_is_refused_and_keeps_its_changes()
    {
        var (client, _, _) = await OwnerWithBaselineAsync();
        var created = await Json(await client.PostAsJsonAsync("/api/scenarios", Plan("Ads", null)));
        var id = created.GetProperty("id").GetString();
        var loaded = created.GetProperty("version").GetInt32();

        await Json(await client.PutAsJsonAsync($"/api/scenarios/{id}", Plan("Ads (laptop)", loaded)));
        await AssertEditConflict(await client.PutAsJsonAsync($"/api/scenarios/{id}", Plan("Ads (phone)", loaded)));

        var stored = await Json(await client.GetAsync($"/api/scenarios/{id}"));
        Assert.Equal("Ads (laptop)", stored.GetProperty("name").GetString());
        Assert.Equal(1, stored.GetProperty("changes").GetArrayLength());
    }

    [Fact]
    public async Task Editing_a_saved_plan_replaces_its_changes()
    {
        // Regression: the replaced changes were sent as UPDATEs of rows that did not exist, and the save failed.
        var (client, _, _) = await OwnerWithBaselineAsync();
        var created = await Json(await client.PostAsJsonAsync("/api/scenarios", Plan("Ads", null)));
        var id = created.GetProperty("id").GetString();

        var edited = await Json(await client.PutAsJsonAsync($"/api/scenarios/{id}", Plan("Ads, edited", created.GetProperty("version").GetInt32())));

        Assert.Equal("Ads, edited", edited.GetProperty("name").GetString());
        Assert.Equal(1, edited.GetProperty("changes").GetArrayLength());
        var stored = await Json(await client.GetAsync($"/api/scenarios/{id}"));
        Assert.Equal(1, stored.GetProperty("changes").GetArrayLength());
    }

    [Fact]
    public async Task Keeping_my_version_means_saving_again_with_the_latest_version()
    {
        var (client, _, baseline) = await OwnerWithBaselineAsync();
        var loaded = baseline.GetProperty("version").GetInt32();
        await Json(await client.PutAsJsonAsync("/api/baseline", Baseline("3000", loaded)));
        await AssertEditConflict(await client.PutAsJsonAsync("/api/baseline", Baseline("1000", loaded)));

        var latest = (await Json(await client.GetAsync("/api/baseline"))).GetProperty("version").GetInt32();
        var mine = await Json(await client.PutAsJsonAsync("/api/baseline", Baseline("1000", latest)));
        Assert.Equal(latest + 1, mine.GetProperty("version").GetInt32());
    }

    [Fact]
    public async Task Creating_what_another_device_already_created_is_a_conflict()
    {
        // Both devices ran set-up; the second one sends no version because it never saw a baseline.
        var (client, _, _) = await OwnerWithBaselineAsync();
        await AssertEditConflict(await client.PutAsJsonAsync("/api/baseline", Baseline("1000", null)));
    }

    [Fact]
    public async Task Two_saves_in_the_same_instant_cannot_both_win()
    {
        // Both requests pass the version check before either writes; the concurrency token stops the second write.
        var (client, _, _) = await OwnerWithBaselineAsync();
        var businessId = (await Json(await client.GetAsync("/api/business"))).GetProperty("id").GetGuid();

        var (scopeA, a) = api.NewDbContext();
        var (scopeB, b) = api.NewDbContext();
        using (scopeA)
        using (scopeB)
        {
            var first = await a.Baselines.SingleAsync(x => x.BusinessId == businessId);
            var second = await b.Baselines.SingleAsync(x => x.BusinessId == businessId);
            first.CashOnHand = 3000; first.Version++;
            second.CashOnHand = 1000; second.Version++;

            await a.SaveChangesAsync();
            await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => b.SaveChangesAsync());
        }
    }
}

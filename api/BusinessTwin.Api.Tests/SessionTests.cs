using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using BusinessTwin.Api.Infrastructure;

namespace BusinessTwin.Api.Tests;

/// <summary>The owner sees the devices signed in to their account and can sign them out.</summary>
public class SessionTests(ApiFactory api) : IClassFixture<ApiFactory>
{
    private const string Laptop = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36";
    private const string Phone = "Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Mobile/15E148 Safari/604.1";

    private static string NewEmail() => $"{Guid.NewGuid():N}@example.test";

    private static async Task<JsonElement[]> Sessions(HttpClient client)
    {
        var response = await client.GetAsync("/api/auth/sessions");
        Assert.True(response.IsSuccessStatusCode, await response.Content.ReadAsStringAsync());
        return (await response.Content.ReadFromJsonAsync<JsonElement[]>())!;
    }

    private static async Task<HttpStatusCode> Probe(HttpClient client) => (await client.GetAsync("/api/auth/manage/info")).StatusCode;

    [Fact]
    public async Task Two_devices_show_as_two_sessions_with_this_device_first()
    {
        var email = NewEmail();
        var laptop = await api.SignedInClientAsync(email, Laptop);
        await api.AnotherDeviceAsync(email, Phone);

        var sessions = await Sessions(laptop);

        Assert.Equal(2, sessions.Length);
        Assert.True(sessions[0].GetProperty("isCurrent").GetBoolean());
        Assert.Equal("Chrome on Windows", sessions[0].GetProperty("device").GetString());
        Assert.False(sessions[1].GetProperty("isCurrent").GetBoolean());
        Assert.Equal("Safari on iPhone", sessions[1].GetProperty("device").GetString());
    }

    [Fact]
    public async Task Sessions_of_another_owner_are_not_listed()
    {
        var mine = await api.SignedInClientAsync(NewEmail());
        await api.SignedInClientAsync(NewEmail());

        Assert.Single(await Sessions(mine));
    }

    [Fact]
    public async Task Signing_out_another_device_ends_its_session()
    {
        var email = NewEmail();
        var laptop = await api.SignedInClientAsync(email, Laptop);
        var phone = await api.AnotherDeviceAsync(email, Phone);
        var phoneSession = (await Sessions(laptop)).Single(s => !s.GetProperty("isCurrent").GetBoolean()).GetProperty("id").GetString();

        Assert.Equal(HttpStatusCode.NoContent, (await laptop.DeleteAsync($"/api/auth/sessions/{phoneSession}")).StatusCode);

        Assert.Equal(HttpStatusCode.Unauthorized, await Probe(phone));
        Assert.Equal(HttpStatusCode.OK, await Probe(laptop));
        Assert.Single(await Sessions(laptop));
    }

    [Fact]
    public async Task Another_owner_cannot_sign_out_my_device()
    {
        var mine = await api.SignedInClientAsync(NewEmail());
        var other = await api.SignedInClientAsync(NewEmail());
        var myId = (await Sessions(mine))[0].GetProperty("id").GetString();

        Assert.Equal(HttpStatusCode.NotFound, (await other.DeleteAsync($"/api/auth/sessions/{myId}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, await Probe(mine));
    }

    [Fact]
    public async Task Signing_out_everywhere_else_keeps_this_device()
    {
        var email = NewEmail();
        var laptop = await api.SignedInClientAsync(email);
        var phone = await api.AnotherDeviceAsync(email);
        var tablet = await api.AnotherDeviceAsync(email);

        Assert.Equal(HttpStatusCode.NoContent, (await laptop.PostAsync("/api/auth/sessions/sign-out-others", null)).StatusCode);

        Assert.Equal(HttpStatusCode.Unauthorized, await Probe(phone));
        Assert.Equal(HttpStatusCode.Unauthorized, await Probe(tablet));
        Assert.Single(await Sessions(laptop));
    }

    [Fact]
    public async Task Signing_out_removes_the_session()
    {
        var email = NewEmail();
        var laptop = await api.SignedInClientAsync(email);
        var phone = await api.AnotherDeviceAsync(email);

        Assert.True((await phone.PostAsync("/api/auth/logout", null)).IsSuccessStatusCode);

        Assert.Single(await Sessions(laptop));
    }

    [Fact]
    public async Task Deleting_the_account_ends_every_session()
    {
        var email = NewEmail();
        var laptop = await api.SignedInClientAsync(email);
        var phone = await api.AnotherDeviceAsync(email);

        Assert.True((await laptop.DeleteAsync("/api/auth/account")).IsSuccessStatusCode);

        Assert.Equal(HttpStatusCode.Unauthorized, await Probe(phone));
    }

    [Theory]
    [InlineData(Laptop, "Chrome on Windows")]
    [InlineData(Phone, "Safari on iPhone")]
    [InlineData("Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:144.0) Gecko/20100101 Firefox/144.0", "Firefox on Mac")]
    [InlineData("Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0 Mobile Safari/537.36 EdgA/142.0", "Edge on Android")]
    [InlineData(null, "Unknown browser")]
    public void Device_labels_are_coarse_and_readable(string? userAgent, string expected) =>
        Assert.Equal(expected, DeviceLabel.From(userAgent));
}

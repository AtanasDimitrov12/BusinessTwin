using BusinessTwin.Api.Contracts;
using BusinessTwin.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BusinessTwin.Api.Controllers;

/// <summary>The signed-in owner's business. One business per owner in the PoC.</summary>
[ApiController]
[Authorize]
[Route("api/business")]
public class BusinessController(AppDbContext db, OwnerScope owner) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<BusinessDto>> Get(CancellationToken ct)
    {
        var business = await owner.GetBusinessAsync(ct);
        return business is null ? NotFound() : ToDto(business);
    }

    [HttpPut]
    public async Task<ActionResult<BusinessDto>> Save(SaveBusinessRequest request, CancellationToken ct)
    {
        var business = await owner.GetBusinessAsync(ct);
        if (business is null)
        {
            business = new Business { OwnerId = owner.UserId, Name = request.Name };
            db.Businesses.Add(business);
        }

        business.Name = request.Name.Trim();
        business.StaffCount = request.StaffCount;
        await db.SaveChangesAsync(ct);
        return ToDto(business);
    }

    /// <summary>Deletes the business with its baseline and all scenarios (privacy: owner can remove their data).</summary>
    [HttpDelete]
    public async Task<IActionResult> Delete(CancellationToken ct)
    {
        var business = await owner.GetBusinessAsync(ct);
        if (business is null) return NotFound();

        db.Businesses.Remove(business);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private static BusinessDto ToDto(Business b) => new(b.Id, b.Name, b.BusinessType, b.StaffCount, b.Baseline is not null);
}

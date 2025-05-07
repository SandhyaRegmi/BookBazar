using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookBazar.Controllers
{
    [Route("api/staff")]
    [ApiController]
    [Authorize(Roles = "Staff")]
    public class StaffController : ControllerBase
    {
        [HttpGet("dashboard")]
        public IActionResult GetStaffDashboard()
        {
            return Ok(new { message = "Welcome to Staff Dashboard" });
        }
    }
}
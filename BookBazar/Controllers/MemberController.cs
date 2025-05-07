using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookBazar.Controllers
{
    [Route("api/member")]
    [ApiController]
    [Authorize(Roles = "Member")]
    public class MemberController : ControllerBase
    {
        [HttpGet("dashboard")]
        public IActionResult GetMemberDashboard()
        {
            return Ok(new { message = "Welcome to Member Dashboard" });
        }
    }
}
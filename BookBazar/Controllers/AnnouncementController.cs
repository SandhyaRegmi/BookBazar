using BookBazar.DTO.Request;
using BookBazar.DTO.Response;
using BookBazar.Service;
using BookBazar.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace BookBazar.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AnnouncementController : ControllerBase
    {
        private readonly AnnouncementService _announcementService;
        private readonly IHubContext<AnnouncementHub> _hubContext;

        public AnnouncementController(AnnouncementService announcementService, IHubContext<AnnouncementHub> hubContext)
        {
            _announcementService = announcementService;
            _hubContext = hubContext;
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveAnnouncements()
        {
            var announcements = await _announcementService.GetActiveAnnouncementsAsync();
            return Ok(announcements);
        }

        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllAnnouncements()
        {
            var announcements = await _announcementService.GetAllAnnouncementsAsync();
            return Ok(announcements);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateAnnouncement([FromBody] CreateAnnouncementDTO dto)
        {
            var createdBy = User.Identity?.Name ?? "System";
            var announcement = await _announcementService.CreateAnnouncementAsync(dto, createdBy);

            // Send to all members
            await _hubContext.Clients.Group("MemberGroup").SendAsync("ReceiveAnnouncement", announcement);

            // Also send to admins
            await _hubContext.Clients.Group("AdminGroup").SendAsync("ReceiveAnnouncement", announcement);

            return CreatedAtAction(nameof(GetActiveAnnouncements), new { id = announcement.Id }, announcement);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateAnnouncement(Guid id, [FromBody] UpdateAnnouncementDTO dto)
        {
            var announcement = await _announcementService.UpdateAnnouncementAsync(id, dto);
            if (announcement == null) return NotFound();

            // Send update to all connected clients
            await _hubContext.Clients.All.SendAsync("UpdateAnnouncement", announcement);

            return Ok(announcement);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteAnnouncement(Guid id)
        {
            var result = await _announcementService.DeleteAnnouncementAsync(id);
            if (!result) return NotFound();

            // Notify all clients about deletion
            await _hubContext.Clients.All.SendAsync("RemoveAnnouncement", id);

            return NoContent();
        }
    }
}
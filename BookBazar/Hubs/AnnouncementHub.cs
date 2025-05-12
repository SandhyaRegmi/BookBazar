using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace BookBazar.Hubs
{
    [Authorize]
public class AnnouncementHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var user = Context.User;
        
        if (user.IsInRole("Admin"))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "AdminGroup");
            await Clients.Caller.SendAsync("ReceiveSystemMessage", "Connected as Admin");
        }
        else
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "MemberGroup");
            await Clients.Caller.SendAsync("ReceiveSystemMessage", "Connected as Member");
        }
        
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception exception)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "AdminGroup");
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "MemberGroup");
        await base.OnDisconnectedAsync(exception);
    }
}
}
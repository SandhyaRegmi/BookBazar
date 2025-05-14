using System.Threading.Tasks;

namespace BookBazar.Service;

public interface IEmailService
{
    Task SendEmailAsync(string toEmail, string subject, string body);
}
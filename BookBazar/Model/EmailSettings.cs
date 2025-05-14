using System.ComponentModel.DataAnnotations;

namespace BookBazar.Model;

public class EmailSettings
{
    [Required]
    public string SmtpServer { get; set; } = string.Empty;

    [Required]
    [Range(1, 65535)]
    public int SmtpPort { get; set; }

    [Required]
    public string SenderName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string SenderEmail { get; set; } = string.Empty;

    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}
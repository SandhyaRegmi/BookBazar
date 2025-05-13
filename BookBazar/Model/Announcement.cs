using System;

namespace BookBazar.Model;

public class Announcement
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string Message { get; set; }
        public DateTime CreatedAt { get; set; }
         public DateTime StartAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public bool IsActive { get; set; }
        public string CreatedBy { get; set; }

         public string Status 
    {
        get
        {
            var now = DateTime.UtcNow;
            if (StartAt > now) return "Upcoming";
            if (ExpiresAt != null && ExpiresAt < now) return "Ended";
            return IsActive ? "Active" : "Inactive";
        }
    }

    }
    

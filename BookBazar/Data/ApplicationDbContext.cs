using System;
using BookBazar.Model;
using Microsoft.EntityFrameworkCore;

namespace BookBazar.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }

     public DbSet<Books> Books { get; set; }

      public DbSet<Announcement> Announcements { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.Entity<Announcement>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired();
            entity.Property(e => e.Message).IsRequired();
            entity.Property(e => e.CreatedBy).IsRequired();
        });
    }
}


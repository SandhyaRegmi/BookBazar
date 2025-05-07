using System;
using BookBazar.Model;
using Microsoft.EntityFrameworkCore;

namespace BookBazar.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }

    
}


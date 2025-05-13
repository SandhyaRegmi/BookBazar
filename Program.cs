using System.Text;
using BookBazar.Data;
using BookBazar.Service;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();

builder.Services.AddDbContext<ApplicationDbContext>(o =>
    o.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.ASCII.GetBytes(builder.Configuration["JwtSettings:Secret"] ?? "YourSuperSecretKey_ThisNeedsToBeAtLeast32Chars!!!")
        ),
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true
    };
});

// Configure authorization policies
builder.Services.AddAuthorization(options =>
{
    // Policy for Admin role
    options.AddPolicy("RequireAdminRole", policy => policy.RequireRole("Admin"));

    // Policy for User role
    options.AddPolicy("RequireUserRole", policy => policy.RequireRole("User"));
});

builder.Services.AddScoped<TokenServices>();





var app = builder.Build();

app.UseStaticFiles();
app.UseDefaultFiles();
app.UseRouting();
app.UseCors(builder => builder
    .WithOrigins("http://localhost:5000")
    .AllowAnyMethod()
    .AllowAnyHeader()
    .AllowCredentials());

//app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();


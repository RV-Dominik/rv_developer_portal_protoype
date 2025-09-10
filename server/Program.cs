using ShowroomBackend.Services;
using ShowroomBackend.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Readyverse Developer Portal API",
        Version = "v1",
        Description = "API for managing showroom projects and assets",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "Readyverse Developer Portal",
            Email = "dev@readyverse.com"
        }
    });
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("CORS:AllowedOrigins").Get<string[]>() 
            ?? new[] { "http://localhost:3000", "http://localhost:8080" };
        
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Add JWT Authentication
var jwtSecret = builder.Configuration["JWT_SECRET"] ?? "your-super-secret-jwt-key-change-this-in-production";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                // Try to get token from cookie first, then from Authorization header
                if (context.Request.Cookies.ContainsKey("auth_token"))
                {
                    context.Token = context.Request.Cookies["auth_token"];
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// Add Authentication Service
builder.Services.AddHttpClient<AuthenticationService>();
builder.Services.AddScoped<AuthenticationService>();

// Add Supabase services
builder.Services.AddScoped<MockSupabaseService>();
builder.Services.AddHttpClient<SupabaseRestService>();
builder.Services.AddScoped<SupabaseRestService>();

// Register the interface based on environment variable
var useMockService = builder.Configuration.GetValue<bool>("USE_MOCK_SUPABASE", true);
if (useMockService)
{
    builder.Services.AddScoped<ISupabaseService, MockSupabaseService>();
    Console.WriteLine("Using MockSupabaseService for development");
}
else
{
    builder.Services.AddScoped<ISupabaseService, SupabaseRestService>();
    Console.WriteLine("Using SupabaseRestService for production");
}

// Add health checks
builder.Services.AddHealthChecks();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    // Enable Swagger in Production for API documentation
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Showroom Backend API v1");
        c.RoutePrefix = "swagger"; // Swagger UI will be available at /swagger
    });
}

app.UseCors("AllowFrontend");

// Add Authentication & Authorization middleware
app.UseAuthentication();
app.UseAuthorization();

// Add Content Security Policy for fonts and Swagger
app.Use(async (context, next) =>
{
    context.Response.Headers["Content-Security-Policy"] = 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' https://fonts.gstatic.com https://cdn.prod.website-files.com; " +
        "connect-src 'self';";
    await next();
});

// Serve static files from web directory
app.UseStaticFiles();

// Map API routes
app.MapControllers();

// Health check endpoint
app.MapHealthChecks("/health");

// Serve the main portal page
app.MapGet("/", () => Results.Redirect("/index.html"));

// Serve the web portal
app.MapFallbackToFile("/index.html");

app.Run();
using ShowroomBackend.Services;
using ShowroomBackend.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
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

// Add Supabase services
builder.Services.AddScoped<MockSupabaseService>();
// builder.Services.AddScoped<SupabaseService>(); // Commented out due to API compatibility issues

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
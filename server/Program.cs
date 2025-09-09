using ShowroomBackend.Services;
using ShowroomBackend.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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

// Add Supabase service
builder.Services.AddScoped<MockSupabaseService>();

// Add health checks
builder.Services.AddHealthChecks();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");

// Serve static files from web directory
app.UseStaticFiles();

// Map API routes
app.MapControllers();

// Health check endpoint
app.MapHealthChecks("/health");

// Serve the main portal page
app.MapGet("/", () => Results.Redirect("/web"));

// Serve the web portal
app.MapFallbackToFile("/web/index.html");

app.Run();
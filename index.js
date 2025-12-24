using BCrypt.Net;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("https://mwikifrontend.vercel.app")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Enable CORS
app.UseCors("AllowFrontend");

// In-memory users (same as your Node.js sample)
var users = new List<User>
{
    new User { Username = "compweb", PinHash = BCrypt.HashPassword("1234") }
};

// Models
record User(string Username, string PinHash);
record LoginRequest(string username, string pin);
record VehicleDetails(string registration, decimal dailyContribution, decimal monthlyFee, decimal loanrepayment);
record ApiResponse(bool success, string? message = null, object? data = null);

// --- API Endpoints ---

// Login
app.MapPost("/api/login", async (LoginRequest request) =>
{
    if (string.IsNullOrEmpty(request.username) || string.IsNullOrEmpty(request.pin))
    {
        return Results.Json(new ApiResponse(false, "Missing credentials"), statusCode: 400);
    }

    var user = users.Find(u => u.Username == request.username);
    if (user == null || !BCrypt.Verify(request.pin, user.PinHash))
    {
        return Results.Json(new ApiResponse(false, "Invalid credentials"), statusCode: 401);
    }

    return Results.Json(new ApiResponse(true));
});

// Forgot Password
app.MapPost("/api/forgotPassword", (dynamic body) =>
{
    string? username = body.username?.ToString();
    return Results.Json(new ApiResponse(true, $"Password reset requested for {username ?? "unknown"}"));
});

// Vehicle Details
app.MapGet("/api/vehicleDetails", (string? registration) =>
{
    if (string.IsNullOrEmpty(registration))
    {
        return Results.Json(new ApiResponse(false, "Registration is required"), statusCode: 400);
    }

    if (registration.ToUpper() == "KCA869H")
    {
        var details = new VehicleDetails(
            registration: registration,
            dailyContribution: 500,
            monthlyFee: 2000,
            loanrepayment: 1000
        );
        return Results.Json(new ApiResponse(true, data: details));
    }

    return Results.Json(new ApiResponse(false, "Vehicle details not found"), statusCode: 404);
});

// Update Contribution
app.MapPost("/api/updateContribution", (dynamic body) =>
{
    string? registration = body.registration?.ToString();

    if (string.IsNullOrEmpty(registration))
    {
        return Results.Json(new ApiResponse(false, "Missing registration"), statusCode: 400);
    }

    return Results.Json(new ApiResponse(true));
});

// Serve static files (if you have a 'wwwroot' folder with public files)
// Uncomment if needed:
// app.UseStaticFiles();

app.Run();
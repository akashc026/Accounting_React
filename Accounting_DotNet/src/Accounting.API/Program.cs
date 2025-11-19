using Accounting.Application;
using Accounting.Application.Features;
using Accounting.Application.Services;
using Accounting.Persistence;
using ExcentOne.Presentation.Features;
using ExcentOne.Presentation.Features.Exceptions;
using ExcentOne.Presentation.Features.Routing;
using FluentValidation;
using Mapster;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers(options => options.SlugifyUrlTokens());
builder.Services.AddValidatorsFromAssemblyContaining<AccountingApplication>();
builder.Services.AddSqlServerDbContext<AccountingDbContext>();
builder.Services.AddMediatR(config =>
{
    config.RegisterServicesFromAssemblyContaining<AccountingApplication>();
});
builder.Services.AddMapster();

builder.Services.AddExceptionHandlersFromAssemblyOf<ValidationExceptionHandler>();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000")
                   .AllowAnyHeader()
                   .AllowAnyMethod()
                   .AllowCredentials();
        });
});

var app = builder.Build();
app.UseCors("CorsPolicy");
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();

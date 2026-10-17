using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace BusinessTwin.Api.Infrastructure;

/// <summary>
/// Writes decimals as JSON strings ("1234.50") so the browser never turns money into a binary float.
/// Reads both strings and numbers.
/// </summary>
public sealed class DecimalStringConverter : JsonConverter<decimal>
{
    private const NumberStyles Style = NumberStyles.AllowLeadingSign | NumberStyles.AllowDecimalPoint;

    public override decimal Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number) return reader.GetDecimal();
        if (reader.TokenType == JsonTokenType.String &&
            decimal.TryParse(reader.GetString(), Style, CultureInfo.InvariantCulture, out var value))
            return value;
        throw new JsonException("Expected a decimal number such as \"1234.50\".");
    }

    // Dividing by 1.000…0 removes trailing zeros (16000.000000 → 16000) without changing the value.
    public override void Write(Utf8JsonWriter writer, decimal value, JsonSerializerOptions options) =>
        writer.WriteStringValue((value / 1.0000000000000000000000000000m).ToString(CultureInfo.InvariantCulture));
}

/// <summary>Describes decimals in the OpenAPI document as strings, matching <see cref="DecimalStringConverter"/>.</summary>
public sealed class DecimalAsStringSchemaTransformer : IOpenApiSchemaTransformer
{
    public Task TransformAsync(OpenApiSchema schema, OpenApiSchemaTransformerContext context, CancellationToken ct)
    {
        var type = context.JsonTypeInfo.Type;
        if (type == typeof(decimal) || type == typeof(decimal?))
            Describe(schema, nullable: type == typeof(decimal?));
        else if (typeof(IEnumerable<decimal>).IsAssignableFrom(type))
            schema.Items = Describe(new OpenApiSchema(), nullable: false); // lists of decimals otherwise lose their item type
        return Task.CompletedTask;
    }

    private static OpenApiSchema Describe(OpenApiSchema schema, bool nullable)
    {
        schema.Type = nullable ? JsonSchemaType.String | JsonSchemaType.Null : JsonSchemaType.String;
        schema.Format = "decimal";
        schema.Pattern = @"^-?\d+(\.\d+)?$";
        return schema;
    }
}

/// <summary>Range check for decimal inputs, without the culture pitfalls of <see cref="RangeAttribute"/>.</summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Parameter)]
public sealed class DecimalRangeAttribute(double minimum, double maximum) : ValidationAttribute
{
    public decimal Minimum { get; } = (decimal)minimum;
    public decimal Maximum { get; } = (decimal)maximum;

    public override bool IsValid(object? value) => value is not decimal d || (d >= Minimum && d <= Maximum);

    public override string FormatErrorMessage(string name) => $"{name} must be between {Minimum} and {Maximum}.";
}

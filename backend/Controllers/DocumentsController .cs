using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models.Requests;
namespace backend.Controllers
{
    [ApiController]
    [Route("api/documents")]
    public class DocumentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DocumentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> UploadDocument([FromBody] DocumentRequest request)
        {
            // Validate UserId and DocumentTypeId
            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null)
            {
                return BadRequest(new { Message = "Invalid UserId. User does not exist." });
            }

            var documentType = await _context.DocumentTypes.FindAsync(request.DocumentTypeId);
            if (documentType == null)
            {
                return BadRequest(new { Message = "Invalid DocumentTypeId. DocumentType does not exist." });
            }

            // Create a new Document entity
            var doc = new Document
            {
                UserId = request.UserId,
                User = user, // Set the User navigation property
                DocumentTypeId = request.DocumentTypeId,
                DocumentType = documentType, // Set the DocumentType navigation property
                OriginalFilePath = request.OriginalFilePath,
                UploadedAt = request.UploadedAt,
                ExtractedData = new ExtractedData
                {
                    Fields = request.ExtractedData.Fields,
                    ExtractedAt = request.UploadedAt // Use UploadedAt or set appropriately
                }
            };

            // Set the Document navigation property on ExtractedData
            doc.ExtractedData.Document = doc;

            _context.Documents.Add(doc);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Document saved successfully",
                DocumentId = doc.Id
            });
        }
    }
}
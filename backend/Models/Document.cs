namespace backend.Models
{
    public class Document
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int DocumentTypeId { get; set; }
        public string OriginalFilePath { get; set; } = null!;
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        public User User { get; set; } 
        public DocumentType DocumentType { get; set; } 
        public ExtractedData ExtractedData { get; set; } 
    }
}

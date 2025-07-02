namespace backend.Models.Requests
{
    public class ExtractedDataRequest
    {
        public string Fields { get; set; } = null!;
        public DateTime ExtractedAt { get; set; }
    }

    public class DocumentRequest
    {
        public int UserId { get; set; }
        public int DocumentTypeId { get; set; }
        public string OriginalFilePath { get; set; } = null!;
        public DateTime UploadedAt { get; set; }
        public ExtractedDataRequest ExtractedData { get; set; } = null!;
    }
}
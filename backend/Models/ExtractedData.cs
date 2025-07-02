using System;

namespace backend.Models
{
    public class ExtractedData
    {
        public int Id { get; set; }
        public int DocumentId { get; set; }
        public Document Document { get; set; } 
        public string Fields { get; set; } = null!;
        public DateTime ExtractedAt { get; set; } = DateTime.UtcNow;
    }
}

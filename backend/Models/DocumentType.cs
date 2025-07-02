using System.Collections.Generic;

namespace backend.Models
{
    public class DocumentType
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;

        public ICollection<Document> Documents { get; set; } = new List<Document>();
    }
}

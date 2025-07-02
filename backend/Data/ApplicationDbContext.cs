using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Document> Documents { get; set; } = null!;
        public DbSet<DocumentType> DocumentTypes { get; set; } = null!;
        public DbSet<ExtractedData> ExtractedData { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Document>()
                .HasOne(d => d.ExtractedData)
                .WithOne(ed => ed.Document)
                .HasForeignKey<ExtractedData>(ed => ed.DocumentId);
        }
    }
}

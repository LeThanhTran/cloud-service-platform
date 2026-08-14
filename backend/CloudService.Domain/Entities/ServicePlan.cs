using CloudService.Domain.Common;

namespace CloudService.Domain.Entities;

public class ServicePlan : BaseEntity
{
	public string Name { get; set; } = string.Empty;

	public string? Description { get; set; }

	public int CpuCores { get; set; }

	public int RamGB { get; set; }

	public int StorageGB { get; set; }

	public int BandwidthGB { get; set; }

	public bool IsFeatured { get; set; }

	public bool IsActive { get; set; } = true;

	public Guid ServiceCategoryId { get; set; }

	public ServiceCategory? ServiceCategory { get; set; }

	public ICollection<PlanPrice> PlanPrices { get; set; }
		= new List<PlanPrice>();

	public ICollection<Promotion> Promotions { get; set; }
		= new List<Promotion>();
	public ICollection<OrderRequest> OrderRequests { get; set; }
	= new List<OrderRequest>();
}
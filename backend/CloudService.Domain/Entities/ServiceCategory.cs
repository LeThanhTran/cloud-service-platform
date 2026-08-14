using CloudService.Domain.Common;

namespace CloudService.Domain.Entities;

public class ServiceCategory : BaseEntity
{
	public string Name { get; set; } = string.Empty;

	public string? Description { get; set; }

	public string? Slug { get; set; }

	public bool IsActive { get; set; } = true;

	public ICollection<ServicePlan> ServicePlans { get; set; }
		= new List<ServicePlan>();
}
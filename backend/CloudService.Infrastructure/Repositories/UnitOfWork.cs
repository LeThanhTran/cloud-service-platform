using CloudService.Application.Interfaces;
using CloudService.Application.Interfaces.Repositories;
using CloudService.Infrastructure.Data;

namespace CloudService.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly CloudServiceDbContext _context;

    public UnitOfWork(CloudServiceDbContext context)
    {
        _context = context;
    }

    public IRepository<T> Repository<T>() where T : class
    {
        return new Repository<T>(_context);
    }

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }
}
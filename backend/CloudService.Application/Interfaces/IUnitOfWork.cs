using CloudService.Application.Interfaces.Repositories;

namespace CloudService.Application.Interfaces;

public interface IUnitOfWork
{
    IRepository<T> Repository<T>() where T : class;

    Task<int> SaveChangesAsync();
}
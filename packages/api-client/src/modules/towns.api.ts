import type { ICreateTownDto, ITown, IUpdateTownDto } from '@jrs/shared';
import type { HttpClient } from '../client';

export class TownsApi {
  constructor(private readonly http: HttpClient) {}

  public getAll(): Promise<ITown[]> {
    return this.http.get<ITown[]>('/towns');
  }

  public getById(id: string): Promise<ITown> {
    return this.http.get<ITown>(`/towns/${id}`);
  }

  public create(dto: ICreateTownDto): Promise<ITown> {
    return this.http.post<ITown>('/towns', dto);
  }

  public update(id: string, dto: IUpdateTownDto): Promise<ITown> {
    return this.http.patch<ITown>(`/towns/${id}`, dto);
  }
}

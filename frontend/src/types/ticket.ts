export interface Ticket {
  name: string;
  description: string;
  image: File;
  location: {
    latitude: number | null;
    longitude: number | null;
  };
  createdAt: string;
}
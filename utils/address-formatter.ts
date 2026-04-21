import { User } from '../data/user.data';

export function formatCheckoutAddressLines(user: User): string[] {
  return [
    `${user.title} ${user.firstName} ${user.lastName}`,
    user.company,
    user.address,
    `${user.city} ${user.state} ${user.zipcode}`,
    user.country,
    user.mobileNumber,
  ];
}

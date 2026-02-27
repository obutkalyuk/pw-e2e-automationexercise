import { getApiContext } from './apiContext';
import { User } from '../data/User';


export async function createUser(user: User) {
  const apiContext = await getApiContext();
  const response = await apiContext.post('/api/createAccount', { data: {
      name: user.name,
      email: user.email,
      password: user.password,
      title: user.title,
      birth_date: user.dayOfBirth,
      birth_month: user.monthOfBirth,
      birth_year: user.yearOfBirth,
      firstname: user.firstName,
      lastname: user.lastName,
      company: user.company,
      address1: user.address,
      address2: '',
      country: user.country,
      state: user.state,
      city: user.city,
      zipcode: user.zipcode,
      mobile_number: user.mobileNumber,
    } });
  if (response.status() !== 201) throw new Error(await response.text());
  return await response.json();
}


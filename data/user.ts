import { faker } from '@faker-js/faker';

export class User {
  name!: string;
  email!: string;
  password!: string;
  title!: 'Mr.' | 'Mrs.';
  dayOfBirth!: string;
  monthOfBirth!: string;
  yearOfBirth!: string;
  newsletter!: boolean;
  offers!: boolean;
  firstName!: string;
  lastName!: string;
  company!: string;
  address!: string;
  country!: string;
  state!: string;
  city!: string;
  zipcode!: string;
  mobileNumber!: string;

  constructor() {}

  static generateRandom(): User {
    const gender = faker.helpers.arrayElement(['Mr.', 'Mrs.']);
    const country = faker.helpers.arrayElement(['India','United States', 'Canada', 'Australia', 'Israel','New Zealand', 'Singapore']);
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const u = new User();
    const timestamp = new Date().toISOString().replace(/[:.-]/g, ''); 
    u.name = `user${Math.floor(Math.random() * 10000)}`;
    u.email = `qa_${timestamp}_${Math.floor(Math.random() * 1000)}@example.com`; 
    u.password = 'Test1234';
    u.title = gender;
    u.dayOfBirth = faker.number.int({ min: 1, max: 28 }).toString();
    u.monthOfBirth = faker.number.int({ min: 1, max: 12 }).toString();
    u.yearOfBirth = faker.number.int({ min: 1980, max: 2000 }).toString();
    u.newsletter = Math.random() > 0.5;
    u.offers = Math.random() > 0.5;
    u.firstName = firstName;
    u.lastName = lastName;
    u.company = 'ACME';
    u.country = country;
    u.address = faker.location.streetAddress();
    u.state = faker.location.state();
    u.city = faker.location.city();
    u.zipcode = faker.location.zipCode();
    u.mobileNumber = faker.phone.number({style:"national"});
    return u;
  }
  toApiForm() {
    return {
      name: this.name,
      email: this.email,
      password: this.password,
      title: this.title.replace('.', ''), 
      birth_date: this.dayOfBirth,
      birth_month: this.monthOfBirth,
      birth_year: this.yearOfBirth,
      firstname: this.firstName,
      lastname: this.lastName,
      company: this.company,
      address1: this.address,
      address2: '', // add empty for API
      country: this.country,
      zipcode: this.zipcode,
      state: this.state,
      city: this.city,
      mobile_number: this.mobileNumber
    };
  }
}

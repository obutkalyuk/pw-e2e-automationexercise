
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

  constructor() {
    
  }

  static generateRandom(): User {
    const u = new User();
    u.name = `user${Math.floor(Math.random() * 10000)}`;
    u.email = `test${Math.floor(Math.random() * 10000)}@example.com`;
    u.password = 'Test1234';
    u.title = Math.random() > 0.5 ? 'Mr.' : 'Mrs.';
    u.dayOfBirth = `${Math.floor(Math.random() * 28) + 1}`;
    u.monthOfBirth = `${Math.floor(Math.random() * 12) + 1}`;
    u.yearOfBirth = `${1980 + Math.floor(Math.random() * 20)}`;
    u.newsletter = Math.random() > 0.5;
    u.offers = Math.random() > 0.5;
    u.firstName = 'John';
    u.lastName = 'Doe';
    u.company = 'ACME';
    u.address = '123 Main St';
    u.country = 'United States';
    u.state = 'California';
    u.city = 'Los Angeles';
    u.zipcode = '90001';
    u.mobileNumber = '555-1234';
    return u;
  }
  toApiForm() {
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
    const email = `qa_${timestamp}_${Math.floor(Math.random() * 1000)}@example.com`;
    return {
      name: this.name,
      email: email,
      password: this.password,
      title: this.title.replace('.', ''), // API не любить крапку в "Mr."
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

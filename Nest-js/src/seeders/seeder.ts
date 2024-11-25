import { Injectable, Logger } from "@nestjs/common";


import { UsersSeederService } from "./user/user.service";
import { RoleSeederService } from "./role/role.service";
import { CountrySeederService } from "./country/country.service";

@Injectable()
export class Seeder {
  constructor(
    private readonly logger: Logger,

    private readonly userService: UsersSeederService,
    private readonly roleService: RoleSeederService,
    private readonly countrySeederService: CountrySeederService,


  ) { }
  async seed(table) {
    let response;
    switch (table) {
      case 'role':
        response = this.roleService.role();
        break;
      case 'countries':
        response = this.countrySeederService.countries();
        break;  
      case 'user':
        response = this.userService.users();
        break;
        default:
        response = this.all();
        break;
    }

    await response
      .then(completed => {
        Promise.resolve(completed);
      })
      .catch(error => {
        Promise.reject(error);
      });
  }
  async all() {

    return await Promise.all([
      
      await this.userService.users(),
      await this.roleService.role(),
      await this.countrySeederService.countries(),
      
    ]);
  }
}

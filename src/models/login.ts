import { Knex } from 'knex'
export class Login {
  login(db: Knex.QueryInterface, username: string, password: string) {
    return db.table('users')
      .where('username', username)
      .where('password', password)
      .limit(1);
  }
}
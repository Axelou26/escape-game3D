import { Model, DataTypes } from 'sequelize';
import { sequelize } from './sequelize';
import Game from './game.model';
import bcrypt from 'bcrypt';

export class User extends Model {
  public id!: number;
  public username!: string;
  public email!: string;
  public password!: string;
  public isAdmin!: boolean;

  // Méthode pour comparer les mots de passe
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  // Méthode pour convertir l'instance en JSON sans le mot de passe
  public toJSON(): any {
    const values = super.toJSON();
    delete values.password;
    return values;
  }
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  sequelize,
  modelName: 'User',
  hooks: {
    beforeCreate: async (user: User) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user: User) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Association avec Game
Game.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Game, { foreignKey: 'userId' }); 
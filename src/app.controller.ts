import { BadRequestException, Body, Controller, Get, HttpCode, Param, Patch, Post, Render, UnprocessableEntityException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppService } from './app.service';
import RegisterDto from './register.dto';
import User from './user.entity';
import * as bcrypt from 'bcrypt';
import ChangeUserDto from './ChangeUserDto.dto';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private dataSource: DataSource,
  ) {}

  @Get()
  @Render('index')
  index() {
    return { message: 'Welcome to the homepage' };
  }

  @Post('/register')
  @HttpCode(200)
  async register(@Body() RegisterDto : RegisterDto) {
    if (!RegisterDto.email || !RegisterDto.password || !RegisterDto.passwordAgain) {
      throw new BadRequestException('All fields are required')
    }
    if (!RegisterDto.email.includes('@')){
      throw new UnprocessableEntityException('Email must contain a @ character'); 
    }
    if (RegisterDto.password !== RegisterDto.passwordAgain) {
      throw new BadRequestException('The two passwrods must match');   
      
    }
    if (RegisterDto.password.length < 8){
      throw new BadRequestException('The password must be at least 8 characters'); 
        
    }
    const userRepository = this.dataSource.getRepository(User);
    const user = new User()
    user.email = RegisterDto.email;
    user.password = await bcrypt.hash(RegisterDto.password, 15)
    let date = new Date()
    user.registrationDate = date;
    await userRepository.save(user);
    
    return user;
  }

  @Patch('/users/:id')
  async UpdateUserProfile(@Param('id') id : number, @Body() userUpdate : ChangeUserDto)  {
    if (!userUpdate.email) {
      throw new BadRequestException('Email field is required')
      
    }
    if (!userUpdate.email.includes('@')) { 
      throw new UnprocessableEntityException('Email must contain a @ character'); 

    }
    if (!userUpdate.profilePictureUrl) {
      userUpdate.profilePictureUrl = null;
    }
    if (userUpdate.profilePictureUrl && !userUpdate.profilePictureUrl.startsWith('https://') &&
     !userUpdate.profilePictureUrl.startsWith('http://')) {
      throw new UnprocessableEntityException('The URL must start with  https:// or http://'); 
    }
    const profileupdateRepo= await this.dataSource.getRepository(User)
    const user = await profileupdateRepo.findOneBy({id})
    user.email = userUpdate.email
    user.profilePictureUrl = userUpdate.profilePictureUrl

    profileupdateRepo.save(user)
    return {
      email : user.email, 
      profilePictureUrl : user.profilePictureUrl
    }
  }
}

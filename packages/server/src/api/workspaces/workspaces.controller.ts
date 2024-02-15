import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RavenInterceptor } from 'nest-raven';
import { Account } from '../accounts/entities/accounts.entity';
import { Request } from 'express';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) {}

  @Get('/')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  public getAllWorkspaces(@Req() { user }: Request) {
    return this.workspacesService.getAllWorkspaces(<Account>user);
  }

  @Get('/current')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  public getCurrentWorkspace(@Req() { user }: Request) {
    return this.workspacesService.getCurrentWorkspace(<Account>user);
  }

  @Post('/set/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  public setCurrentWorkspace(
    @Req() { user }: Request,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.workspacesService.setCurrentWorkspace(<Account>user, id);
  }

  @Post('/')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  public createWorkspace(
    @Req() { user }: Request,
    @Body() createWorkspaceDto: CreateWorkspaceDto
  ) {
    return this.workspacesService.createWorkspace(
      <Account>user,
      createWorkspaceDto
    );
  }
}

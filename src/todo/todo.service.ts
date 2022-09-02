import {ForbiddenException, Injectable} from '@nestjs/common';
import {PrismaService} from "../prisma/prisma.service";
import {CreateTaskDto} from "./DTO/create-task.dto";
import {Task} from '@prisma/client'
import {UpdateTaskDto} from "./DTO/update-task.dto";

@Injectable()
export class TodoService {
    constructor(private prisma: PrismaService) {
    }

    getTasks(userId: number): Promise<Task[]> {
        return this.prisma.task.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    getTaskById(userId: number, taskId: number): Promise<Task> {
        return this.prisma.task.findFirst({
            where: {
                userId,
                id: taskId,
            }
        })
    }

    async createTask(userId: number, dto: CreateTaskDto): Promise<Task> {
        return await this.prisma.task.create({
            data: {
                userId,
                ...dto,
            },
        });
    }

    async updateTaskById(
        userId: number,
        taskId: number,
        dto: UpdateTaskDto,
    ): Promise<Task> {
        const task = await this.prisma.task.findUnique({
            where: {
                id: taskId,
            },
        });
        if (!task || task.userId !== userId)
            throw new ForbiddenException('No permission to update');
        return this.prisma.task.update({
            where: {
                id: taskId,
            },
            data: {
                ...dto,
            },
        });
    }

    async deleteTaskById(userId: number, taskId: number): Promise<void> {
        const task = await this.prisma.task.findUnique({
            where: {
                id: taskId,
            },
        });
        if (!task || task.userId !== userId)
            throw new ForbiddenException('No permission')
        await this.prisma.task.delete({
            where: {
                id: taskId,
            },
        });
    }
}

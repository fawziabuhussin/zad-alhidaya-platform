/**
 * Report Repository
 * Data access layer for content error reports
 */
import { prisma } from '../utils/prisma';
import { CreateReportDTO, UpdateReportDTO, ReportFilters, ReportWithRelations } from '../types/report.types';

/**
 * Common include for report queries with relations
 */
const reportInclude = {
  reporter: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  course: {
    select: {
      id: true,
      title: true,
      teacherId: true,
    },
  },
  lesson: {
    select: {
      id: true,
      title: true,
      order: true,
      module: {
        select: {
          id: true,
          title: true,
          order: true,
        },
      },
    },
  },
  reviewer: {
    select: {
      id: true,
      name: true,
    },
  },
};

export class ReportRepository {
  /**
   * Create a new report
   */
  async create(reporterId: string, data: CreateReportDTO) {
    return prisma.contentReport.create({
      data: {
        reporterId,
        courseId: data.courseId,
        lessonId: data.lessonId,
        type: data.type,
        description: data.description,
        timestamp: data.timestamp,
      },
      include: reportInclude,
    });
  }

  /**
   * Find report by ID
   */
  async findById(id: string) {
    return prisma.contentReport.findUnique({
      where: { id },
      include: reportInclude,
    });
  }

  /**
   * Find reports by reporter ID (for student's own reports)
   */
  async findByReporterId(reporterId: string) {
    return prisma.contentReport.findMany({
      where: { reporterId },
      include: reportInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find all reports with optional filters (for admin/teacher)
   */
  async findAll(filters: ReportFilters = {}) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.courseId) {
      where.courseId = filters.courseId;
    }
    if (filters.lessonId) {
      where.lessonId = filters.lessonId;
    }

    return prisma.contentReport.findMany({
      where,
      include: reportInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find reports for courses taught by a specific teacher
   */
  async findByTeacherId(teacherId: string, filters: ReportFilters = {}) {
    const where: any = {
      course: {
        teacherId,
      },
    };

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.courseId) {
      where.courseId = filters.courseId;
    }

    return prisma.contentReport.findMany({
      where,
      include: reportInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Count new reports (for badge)
   */
  async countNew() {
    return prisma.contentReport.count({
      where: { status: 'NEW' },
    });
  }

  /**
   * Count new reports for a teacher's courses
   */
  async countNewByTeacherId(teacherId: string) {
    return prisma.contentReport.count({
      where: {
        status: 'NEW',
        course: {
          teacherId,
        },
      },
    });
  }

  /**
   * Update report status
   */
  async updateStatus(id: string, reviewerId: string, data: UpdateReportDTO) {
    const updateData: any = {
      status: data.status,
      reviewerId,
      reviewNote: data.reviewNote,
      updatedAt: new Date(),
    };

    // Set resolvedAt if status is RESOLVED or DISMISSED
    if (data.status === 'RESOLVED' || data.status === 'DISMISSED') {
      updateData.resolvedAt = new Date();
    }

    return prisma.contentReport.update({
      where: { id },
      data: updateData,
      include: reportInclude,
    });
  }

  /**
   * Delete a report
   */
  async delete(id: string) {
    return prisma.contentReport.delete({
      where: { id },
    });
  }
}

/**
 * Singleton instance
 */
export const reportRepository = new ReportRepository();

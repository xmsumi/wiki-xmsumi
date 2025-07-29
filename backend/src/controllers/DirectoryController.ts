import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { DirectoryRepository } from '@/repositories/DirectoryRepository';
import { Directory } from '@/models/Directory';
import { db } from '@/config/database';
import { logger } from '@/utils/logger';
import { 
  CreateDirectoryRequest, 
  UpdateDirectoryRequest, 
  MoveDirectoryRequest,
  DirectoryQueryOptions 
} from '@/types/directory';

/**
 * 目录控制器
 */
export class DirectoryController {
  private directoryRepository: DirectoryRepository;

  constructor() {
    this.directoryRepository = new DirectoryRepository();
  }

  /**
   * 获取目录结构
   */
  async getDirectories(req: Request, res: Response): Promise<void> {
    try {
      // 验证请求参数
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '请求参数验证失败',
            details: errors.array()
          }
        });
        return;
      }

      const options: DirectoryQueryOptions = {
        parent_id: req.query.parent_id ? parseInt(req.query.parent_id as string) : undefined,
        include_children: req.query.include_children === 'true',
        include_documents: req.query.include_documents === 'true',
        max_depth: req.query.max_depth ? parseInt(req.query.max_depth as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
        sort_by: req.query.sort_by as any,
        sort_order: req.query.sort_order as any
      };

      let directories: Directory[];
      
      if (options.parent_id !== undefined) {
        // 获取指定父目录的子目录
        directories = await this.directoryRepository.findByParentId(options.parent_id, options);
      } else {
        // 获取所有目录或根目录
        directories = await this.directoryRepository.findAll(options);
      }

      // 如果需要包含文档数量信息
      let documentCounts: Map<number, number> | undefined;
      if (options.include_documents) {
        const directoryIds = directories.map(d => d.id);
        documentCounts = await this.directoryRepository.getDocumentCounts(directoryIds);
      }

      // 如果需要构建树形结构
      if (options.include_children) {
        const tree = Directory.buildTree(directories, documentCounts);
        res.json({
          success: true,
          data: {
            directories: tree,
            total: tree.length
          }
        });
      } else {
        // 返回扁平列表
        const responses = directories.map(dir => {
          const docCount = documentCounts?.get(dir.id);
          return dir.toResponse(undefined, docCount, docCount);
        });

        res.json({
          success: true,
          data: {
            directories: responses,
            total: responses.length
          }
        });
      }

    } catch (error) {
      logger.error('获取目录列表失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取目录列表失败'
        }
      });
    }
  }

  /**
   * 根据ID获取单个目录
   */
  async getDirectoryById(req: Request, res: Response): Promise<void> {
    try {
      // 验证请求参数
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '请求参数验证失败',
            details: errors.array()
          }
        });
        return;
      }

      const directoryId = parseInt(req.params.id);
      const directory = await this.directoryRepository.findById(directoryId);

      if (!directory) {
        res.status(404).json({
          success: false,
          error: {
            code: 'DIRECTORY_NOT_FOUND',
            message: '目录不存在'
          }
        });
        return;
      }

      // 获取文档数量
      const documentCount = await this.directoryRepository.getDocumentCount(directoryId);

      res.json({
        success: true,
        data: directory.toResponse(undefined, documentCount, documentCount)
      });

    } catch (error) {
      logger.error('获取目录详情失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取目录详情失败'
        }
      });
    }
  }

  /**
   * 创建目录
   */
  async createDirectory(req: Request, res: Response): Promise<void> {
    try {
      // 验证请求参数
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '请求参数验证失败',
            details: errors.array()
          }
        });
        return;
      }

      const createRequest: CreateDirectoryRequest = req.body;

      // 检查父目录是否存在
      let parentPath: string | undefined;
      if (createRequest.parent_id) {
        const parentDirectory = await this.directoryRepository.findById(createRequest.parent_id);
        if (!parentDirectory) {
          res.status(400).json({
            success: false,
            error: {
              code: 'PARENT_DIRECTORY_NOT_FOUND',
              message: '父目录不存在'
            }
          });
          return;
        }
        parentPath = parentDirectory.path;
      }

      // 构建目录路径
      const directoryPath = Directory.buildPath(parentPath, createRequest.name);

      // 检查路径是否已存在
      const existingDirectory = await this.directoryRepository.findByPath(directoryPath);
      if (existingDirectory) {
        res.status(409).json({
          success: false,
          error: {
            code: 'DIRECTORY_PATH_EXISTS',
            message: '该路径下已存在同名目录'
          }
        });
        return;
      }

      // 设置排序顺序
      if (createRequest.sort_order === undefined) {
        createRequest.sort_order = await this.directoryRepository.getNextSortOrder(createRequest.parent_id || null);
      }

      // 创建目录数据
      const directoryData = Directory.fromCreateRequest(createRequest, parentPath);

      // 保存到数据库
      const createdDirectory = await this.directoryRepository.create(directoryData);

      res.status(201).json({
        success: true,
        data: {
          message: '目录创建成功',
          directory: createdDirectory.toResponse()
        }
      });

    } catch (error) {
      logger.error('创建目录失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '创建目录失败'
        }
      });
    }
  }

  /**
   * 更新目录
   */
  async updateDirectory(req: Request, res: Response): Promise<void> {
    try {
      // 验证请求参数
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '请求参数验证失败',
            details: errors.array()
          }
        });
        return;
      }

      const directoryId = parseInt(req.params.id);
      const updateRequest: UpdateDirectoryRequest = req.body;

      // 检查目录是否存在
      const existingDirectory = await this.directoryRepository.findById(directoryId);
      if (!existingDirectory) {
        res.status(404).json({
          success: false,
          error: {
            code: 'DIRECTORY_NOT_FOUND',
            message: '目录不存在'
          }
        });
        return;
      }

      // 如果更新了父目录，检查父目录是否存在
      if (updateRequest.parent_id !== undefined) {
        if (updateRequest.parent_id === directoryId) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_PARENT',
              message: '目录不能设置自己为父目录'
            }
          });
          return;
        }

        if (updateRequest.parent_id !== null) {
          const parentDirectory = await this.directoryRepository.findById(updateRequest.parent_id);
          if (!parentDirectory) {
            res.status(400).json({
              success: false,
              error: {
                code: 'PARENT_DIRECTORY_NOT_FOUND',
                message: '父目录不存在'
              }
            });
            return;
          }

          // 检查是否会造成循环引用
          if (existingDirectory.wouldCreateCycle(parentDirectory.path)) {
            res.status(400).json({
              success: false,
              error: {
                code: 'CIRCULAR_REFERENCE',
                message: '不能将目录移动到其子目录下'
              }
            });
            return;
          }
        }
      }

      // 如果更新了名称或父目录，需要更新路径
      let needsPathUpdate = false;
      let newPath = existingDirectory.path;

      if (updateRequest.name !== undefined || updateRequest.parent_id !== undefined) {
        const newName = updateRequest.name || existingDirectory.name;
        let newParentPath: string | undefined;

        if (updateRequest.parent_id !== undefined) {
          if (updateRequest.parent_id === null) {
            newParentPath = undefined;
          } else {
            const parentDirectory = await this.directoryRepository.findById(updateRequest.parent_id);
            newParentPath = parentDirectory!.path;
          }
        } else {
          newParentPath = existingDirectory.getParentPath() === '/' ? undefined : existingDirectory.getParentPath();
        }

        newPath = Directory.buildPath(newParentPath, newName);

        if (newPath !== existingDirectory.path) {
          // 检查新路径是否已存在
          const pathExists = await this.directoryRepository.pathExists(newPath, directoryId);
          if (pathExists) {
            res.status(409).json({
              success: false,
              error: {
                code: 'DIRECTORY_PATH_EXISTS',
                message: '该路径下已存在同名目录'
              }
            });
            return;
          }
          needsPathUpdate = true;
        }
      }

      // 更新目录数据
      const updateData = Directory.fromUpdateRequest(updateRequest);
      if (needsPathUpdate) {
        updateData.path = newPath;
      }

      const updatedDirectory = await this.directoryRepository.update(directoryId, updateData);

      // 如果路径发生了变化，需要更新所有子目录的路径
      if (needsPathUpdate && updatedDirectory) {
        const descendants = await this.directoryRepository.getDescendants(directoryId);
        if (descendants.length > 0) {
          const pathUpdates = descendants.map(descendant => ({
            id: descendant.id,
            newPath: descendant.path.replace(existingDirectory.path, newPath)
          }));
          await this.directoryRepository.updatePaths(pathUpdates);
        }
      }

      res.json({
        success: true,
        data: {
          message: '目录更新成功',
          directory: updatedDirectory!.toResponse()
        }
      });

    } catch (error) {
      logger.error('更新目录失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '更新目录失败'
        }
      });
    }
  }

  /**
   * 删除目录
   */
  async deleteDirectory(req: Request, res: Response): Promise<void> {
    try {
      // 验证请求参数
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '请求参数验证失败',
            details: errors.array()
          }
        });
        return;
      }

      const directoryId = parseInt(req.params.id);

      // 检查目录是否存在
      const directory = await this.directoryRepository.findById(directoryId);
      if (!directory) {
        res.status(404).json({
          success: false,
          error: {
            code: 'DIRECTORY_NOT_FOUND',
            message: '目录不存在'
          }
        });
        return;
      }

      // 检查删除条件
      const deleteCheck = await this.directoryRepository.checkDeleteStatus(directoryId);
      if (!deleteCheck.can_delete) {
        res.status(400).json({
          success: false,
          error: {
            code: 'DIRECTORY_NOT_EMPTY',
            message: '目录不为空，无法删除',
            details: {
              has_children: deleteCheck.has_children,
              has_documents: deleteCheck.has_documents,
              children_count: deleteCheck.children_count,
              document_count: deleteCheck.document_count,
              warnings: deleteCheck.warnings
            }
          }
        });
        return;
      }

      // 删除目录
      const deleted = await this.directoryRepository.delete(directoryId);
      if (!deleted) {
        res.status(500).json({
          success: false,
          error: {
            code: 'DELETE_FAILED',
            message: '删除目录失败'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: {
          message: '目录删除成功'
        }
      });

    } catch (error) {
      logger.error('删除目录失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '删除目录失败'
        }
      });
    }
  }

  /**
   * 移动目录
   */
  async moveDirectory(req: Request, res: Response): Promise<void> {
    try {
      // 验证请求参数
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '请求参数验证失败',
            details: errors.array()
          }
        });
        return;
      }

      const moveRequest: MoveDirectoryRequest & { source_id: number } = req.body;

      // 检查源目录是否存在
      const sourceDirectory = await this.directoryRepository.findById(moveRequest.source_id);
      if (!sourceDirectory) {
        res.status(404).json({
          success: false,
          error: {
            code: 'SOURCE_DIRECTORY_NOT_FOUND',
            message: '源目录不存在'
          }
        });
        return;
      }

      // 检查目标父目录
      let targetParentPath: string | undefined;
      if (moveRequest.target_parent_id) {
        if (moveRequest.target_parent_id === moveRequest.source_id) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_TARGET',
              message: '目录不能移动到自己下面'
            }
          });
          return;
        }

        const targetParentDirectory = await this.directoryRepository.findById(moveRequest.target_parent_id);
        if (!targetParentDirectory) {
          res.status(400).json({
            success: false,
            error: {
              code: 'TARGET_PARENT_NOT_FOUND',
              message: '目标父目录不存在'
            }
          });
          return;
        }

        // 检查是否会造成循环引用
        if (sourceDirectory.wouldCreateCycle(targetParentDirectory.path)) {
          res.status(400).json({
            success: false,
            error: {
              code: 'CIRCULAR_REFERENCE',
              message: '不能将目录移动到其子目录下'
            }
          });
          return;
        }

        targetParentPath = targetParentDirectory.path;
      }

      // 计算新路径
      const newPath = sourceDirectory.updatePath(targetParentPath || '/');

      // 检查新路径是否已存在
      const pathExists = await this.directoryRepository.pathExists(newPath, moveRequest.source_id);
      if (pathExists) {
        res.status(409).json({
          success: false,
          error: {
            code: 'DIRECTORY_PATH_EXISTS',
            message: '目标位置已存在同名目录'
          }
        });
        return;
      }

      // 设置排序顺序
      let sortOrder = moveRequest.new_sort_order;
      if (sortOrder === undefined) {
        sortOrder = await this.directoryRepository.getNextSortOrder(moveRequest.target_parent_id || null);
      }

      // 更新目录
      const updateData = {
        parent_id: moveRequest.target_parent_id || null,
        path: newPath,
        sort_order: sortOrder,
        updated_at: new Date()
      };

      const updatedDirectory = await this.directoryRepository.update(moveRequest.source_id, updateData);

      // 更新所有子目录的路径
      const descendants = await this.directoryRepository.getDescendants(moveRequest.source_id);
      const affectedPaths: Array<{ id: number; old_path: string; new_path: string }> = [];

      if (descendants.length > 0) {
        const pathUpdates = descendants.map(descendant => {
          const oldPath = descendant.path;
          const newDescendantPath = descendant.path.replace(sourceDirectory.path, newPath);
          affectedPaths.push({
            id: descendant.id,
            old_path: oldPath,
            new_path: newDescendantPath
          });
          return {
            id: descendant.id,
            newPath: newDescendantPath
          };
        });
        await this.directoryRepository.updatePaths(pathUpdates);
      }

      res.json({
        success: true,
        data: {
          message: '目录移动成功',
          moved_directory: updatedDirectory!.toResponse(),
          affected_paths: affectedPaths
        }
      });

    } catch (error) {
      logger.error('移动目录失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '移动目录失败'
        }
      });
    }
  }

  /**
   * 重新排序同级目录
   */
  async reorderDirectories(req: Request, res: Response): Promise<void> {
    try {
      // 验证请求参数
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '请求参数验证失败',
            details: errors.array()
          }
        });
        return;
      }

      const { parent_id, ordered_ids }: { parent_id?: number; ordered_ids: number[] } = req.body;

      // 检查父目录是否存在
      if (parent_id) {
        const parentExists = await this.directoryRepository.exists(parent_id);
        if (!parentExists) {
          res.status(400).json({
            success: false,
            error: {
              code: 'PARENT_DIRECTORY_NOT_FOUND',
              message: '父目录不存在'
            }
          });
          return;
        }
      }

      // 检查所有目录是否存在且属于同一父目录
      const directories = await Promise.all(
        ordered_ids.map(id => this.directoryRepository.findById(id))
      );

      for (let i = 0; i < directories.length; i++) {
        const directory = directories[i];
        if (!directory) {
          res.status(400).json({
            success: false,
            error: {
              code: 'DIRECTORY_NOT_FOUND',
              message: `目录 ${ordered_ids[i]} 不存在`
            }
          });
          return;
        }

        if (directory.parent_id !== (parent_id || null)) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_DIRECTORY_PARENT',
              message: `目录 ${ordered_ids[i]} 不属于指定的父目录`
            }
          });
          return;
        }
      }

      // 重新排序
      await this.directoryRepository.reorderSiblings(parent_id || null, ordered_ids);

      res.json({
        success: true,
        data: {
          message: '目录排序更新成功'
        }
      });

    } catch (error) {
      logger.error('重新排序目录失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '重新排序目录失败'
        }
      });
    }
  }

  /**
   * 获取目录统计信息
   */
  async getDirectoryStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.directoryRepository.getStats();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('获取目录统计信息失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取目录统计信息失败'
        }
      });
    }
  }
}
import { DirectoryRepository } from '@/repositories/DirectoryRepository';
import { DocumentRepository } from '@/repositories/DocumentRepository';
import { Directory } from '@/models/Directory';
import { logger } from '@/utils/logger';
import { 
  DirectoryDeleteCheck, 
  DirectoryMoveResult,
  DirectoryResponse 
} from '@/types/directory';

/**
 * 目录服务类 - 处理复杂的目录操作和级联逻辑
 */
export class DirectoryService {
  private directoryRepository: DirectoryRepository;
  private documentRepository: DocumentRepository;

  constructor() {
    this.directoryRepository = new DirectoryRepository();
    this.documentRepository = new DocumentRepository();
  }

  /**
   * 检查目录删除前的详细状态
   */
  async checkDeleteStatus(directoryId: number): Promise<DirectoryDeleteCheck> {
    try {
      const directory = await this.directoryRepository.findById(directoryId);
      if (!directory) {
        throw new Error('目录不存在');
      }

      // 获取子目录
      const children = await this.directoryRepository.findByParentId(directoryId);
      const hasChildren = children.length > 0;

      // 获取直接文档数量
      const documentCount = await this.directoryRepository.getDocumentCount(directoryId);
      const hasDocuments = documentCount > 0;

      // 获取所有后代目录
      const descendants = await this.directoryRepository.getDescendants(directoryId);
      
      // 获取后代目录中的文档数量
      const descendantIds = descendants.map(d => d.id);
      const descendantDocumentCounts = await this.directoryRepository.getDocumentCounts(descendantIds);
      const totalDescendantDocuments = Array.from(descendantDocumentCounts.values())
        .reduce((sum, count) => sum + count, 0);
      
      const totalDocumentCount = documentCount + totalDescendantDocuments;

      // 生成警告信息
      const warnings: string[] = [];
      if (hasChildren) {
        warnings.push(`该目录包含 ${children.length} 个子目录`);
      }
      if (hasDocuments) {
        warnings.push(`该目录包含 ${documentCount} 个文档`);
      }
      if (totalDescendantDocuments > 0) {
        warnings.push(`子目录中包含 ${totalDescendantDocuments} 个文档`);
      }
      if (descendants.length > 0) {
        warnings.push(`删除操作将影响 ${descendants.length + 1} 个目录`);
      }

      return {
        can_delete: !hasChildren && !hasDocuments,
        has_children: hasChildren,
        has_documents: hasDocuments,
        children_count: children.length,
        document_count: documentCount,
        total_document_count: totalDocumentCount,
        warnings
      };

    } catch (error) {
      logger.error('检查目录删除状态失败:', error);
      throw error;
    }
  }

  /**
   * 强制删除目录（包括所有子目录和文档）
   */
  async forceDeleteDirectory(directoryId: number): Promise<{
    deleted_directories: number[];
    deleted_documents: number[];
    warnings: string[];
  }> {
    try {
      const directory = await this.directoryRepository.findById(directoryId);
      if (!directory) {
        throw new Error('目录不存在');
      }

      // 获取所有要删除的目录（包括自身）
      const descendants = await this.directoryRepository.getDescendants(directoryId);
      const allDirectoriesToDelete = [directory, ...descendants];
      const directoryIds = allDirectoriesToDelete.map(d => d.id);

      // 获取所有要删除的文档
      const deletedDocuments: number[] = [];
      for (const dirId of directoryIds) {
        // 这里需要实现获取目录下所有文档ID的方法
        // 暂时使用占位符，实际实现需要在DocumentRepository中添加相应方法
        // const documentIds = await this.documentRepository.findIdsByDirectoryId(dirId);
        // deletedDocuments.push(...documentIds);
      }

      // 生成警告信息
      const warnings: string[] = [];
      if (descendants.length > 0) {
        warnings.push(`将删除 ${descendants.length} 个子目录`);
      }
      if (deletedDocuments.length > 0) {
        warnings.push(`将删除 ${deletedDocuments.length} 个文档`);
      }
      warnings.push('此操作不可逆，请确认后再执行');

      // 按照从深到浅的顺序删除目录（避免外键约束问题）
      const sortedDirectories = allDirectoriesToDelete.sort((a, b) => b.getLevel() - a.getLevel());
      
      // 删除文档（如果需要）
      for (const docId of deletedDocuments) {
        // await this.documentRepository.delete(docId);
      }

      // 删除目录
      const deletedDirectoryIds: number[] = [];
      for (const dir of sortedDirectories) {
        const deleted = await this.directoryRepository.delete(dir.id);
        if (deleted) {
          deletedDirectoryIds.push(dir.id);
        }
      }

      return {
        deleted_directories: deletedDirectoryIds,
        deleted_documents: deletedDocuments,
        warnings
      };

    } catch (error) {
      logger.error('强制删除目录失败:', error);
      throw error;
    }
  }

  /**
   * 移动目录及其所有子目录
   */
  async moveDirectoryWithChildren(
    sourceId: number, 
    targetParentId?: number, 
    newSortOrder?: number
  ): Promise<DirectoryMoveResult> {
    try {
      const sourceDirectory = await this.directoryRepository.findById(sourceId);
      if (!sourceDirectory) {
        throw new Error('源目录不存在');
      }

      // 检查目标父目录
      let targetParentPath: string | undefined;
      if (targetParentId) {
        const targetParent = await this.directoryRepository.findById(targetParentId);
        if (!targetParent) {
          throw new Error('目标父目录不存在');
        }

        // 检查循环引用
        if (sourceDirectory.wouldCreateCycle(targetParent.path)) {
          throw new Error('不能将目录移动到其子目录下');
        }

        targetParentPath = targetParent.path;
      }

      // 计算新路径
      const newPath = sourceDirectory.updatePath(targetParentPath || '/');

      // 检查路径冲突
      const pathExists = await this.directoryRepository.pathExists(newPath, sourceId);
      if (pathExists) {
        throw new Error('目标位置已存在同名目录');
      }

      // 获取所有子目录
      const descendants = await this.directoryRepository.getDescendants(sourceId);

      // 设置排序顺序
      if (newSortOrder === undefined) {
        newSortOrder = await this.directoryRepository.getNextSortOrder(targetParentId || null);
      }

      // 更新源目录
      const updateData = {
        parent_id: targetParentId || null,
        path: newPath,
        sort_order: newSortOrder,
        updated_at: new Date()
      };

      const updatedDirectory = await this.directoryRepository.update(sourceId, updateData);
      if (!updatedDirectory) {
        throw new Error('更新源目录失败');
      }

      // 更新所有子目录的路径
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

      return {
        moved_directory: updatedDirectory.toResponse(),
        affected_paths: affectedPaths
      };

    } catch (error) {
      logger.error('移动目录失败:', error);
      throw error;
    }
  }

  /**
   * 批量移动目录
   */
  async batchMoveDirectories(
    moves: Array<{ source_id: number; target_parent_id?: number; new_sort_order?: number }>
  ): Promise<{
    successful_moves: DirectoryMoveResult[];
    failed_moves: Array<{ source_id: number; error: string }>;
  }> {
    const successfulMoves: DirectoryMoveResult[] = [];
    const failedMoves: Array<{ source_id: number; error: string }> = [];

    for (const move of moves) {
      try {
        const result = await this.moveDirectoryWithChildren(
          move.source_id,
          move.target_parent_id,
          move.new_sort_order
        );
        successfulMoves.push(result);
      } catch (error) {
        failedMoves.push({
          source_id: move.source_id,
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    }

    return {
      successful_moves: successfulMoves,
      failed_moves: failedMoves
    };
  }

  /**
   * 复制目录结构（不包含文档内容）
   */
  async copyDirectoryStructure(
    sourceId: number,
    targetParentId?: number,
    newName?: string
  ): Promise<{
    copied_directory: DirectoryResponse;
    copied_children: DirectoryResponse[];
  }> {
    try {
      const sourceDirectory = await this.directoryRepository.findById(sourceId);
      if (!sourceDirectory) {
        throw new Error('源目录不存在');
      }

      // 检查目标父目录
      let targetParentPath: string | undefined;
      if (targetParentId) {
        const targetParent = await this.directoryRepository.findById(targetParentId);
        if (!targetParent) {
          throw new Error('目标父目录不存在');
        }
        targetParentPath = targetParent.path;
      }

      // 创建根目录副本
      const copyName = newName || `${sourceDirectory.name}_副本`;
      const copyPath = Directory.buildPath(targetParentPath, copyName);

      // 检查路径冲突
      const pathExists = await this.directoryRepository.pathExists(copyPath);
      if (pathExists) {
        throw new Error('目标位置已存在同名目录');
      }

      // 创建根目录
      const rootCopyData = Directory.fromCreateRequest({
        name: copyName,
        description: sourceDirectory.description,
        parent_id: targetParentId,
        sort_order: await this.directoryRepository.getNextSortOrder(targetParentId || null)
      }, targetParentPath);

      const copiedRoot = await this.directoryRepository.create(rootCopyData);

      // 获取所有子目录
      const descendants = await this.directoryRepository.getDescendants(sourceId);
      const copiedChildren: DirectoryResponse[] = [];

      // 复制子目录结构
      for (const descendant of descendants) {
        const relativePath = descendant.path.replace(sourceDirectory.path, '');
        const newDescendantPath = copiedRoot.path + relativePath;
        const parentPath = newDescendantPath.substring(0, newDescendantPath.lastIndexOf('/'));
        
        // 找到父目录ID
        let parentId: number | undefined;
        if (parentPath === copiedRoot.path) {
          parentId = copiedRoot.id;
        } else {
          const parentDir = await this.directoryRepository.findByPath(parentPath);
          parentId = parentDir?.id;
        }

        const childCopyData = Directory.fromCreateRequest({
          name: descendant.name,
          description: descendant.description,
          parent_id: parentId,
          sort_order: descendant.sort_order
        }, parentPath === '/' ? undefined : parentPath);

        const copiedChild = await this.directoryRepository.create(childCopyData);
        copiedChildren.push(copiedChild.toResponse());
      }

      return {
        copied_directory: copiedRoot.toResponse(),
        copied_children: copiedChildren
      };

    } catch (error) {
      logger.error('复制目录结构失败:', error);
      throw error;
    }
  }

  /**
   * 获取目录的完整路径信息
   */
  async getDirectoryPathInfo(directoryId: number): Promise<{
    directory: DirectoryResponse;
    ancestors: DirectoryResponse[];
    children: DirectoryResponse[];
    breadcrumb: Array<{ id: number; name: string; path: string }>;
  }> {
    try {
      const directory = await this.directoryRepository.findById(directoryId);
      if (!directory) {
        throw new Error('目录不存在');
      }

      // 获取祖先目录
      const ancestors = await this.directoryRepository.getAncestors(directoryId);
      
      // 获取直接子目录
      const children = await this.directoryRepository.findByParentId(directoryId);

      // 构建面包屑导航
      const breadcrumb = [
        { id: 0, name: '根目录', path: '/' },
        ...ancestors.map(ancestor => ({
          id: ancestor.id,
          name: ancestor.name,
          path: ancestor.path
        })),
        {
          id: directory.id,
          name: directory.name,
          path: directory.path
        }
      ];

      return {
        directory: directory.toResponse(),
        ancestors: ancestors.map(a => a.toResponse()),
        children: children.map(c => c.toResponse()),
        breadcrumb
      };

    } catch (error) {
      logger.error('获取目录路径信息失败:', error);
      throw error;
    }
  }

  /**
   * 验证目录操作的权限和约束
   */
  async validateDirectoryOperation(
    operation: 'create' | 'update' | 'delete' | 'move',
    directoryId?: number,
    targetParentId?: number
  ): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 检查目录是否存在
      if (directoryId) {
        const directory = await this.directoryRepository.findById(directoryId);
        if (!directory) {
          errors.push('目录不存在');
          return { valid: false, errors, warnings };
        }

        // 删除操作的特殊检查
        if (operation === 'delete') {
          const deleteCheck = await this.checkDeleteStatus(directoryId);
          if (!deleteCheck.can_delete) {
            errors.push('目录不为空，无法删除');
            warnings.push(...deleteCheck.warnings);
          }
        }

        // 移动操作的特殊检查
        if (operation === 'move' && targetParentId) {
          if (targetParentId === directoryId) {
            errors.push('不能将目录移动到自己下面');
          } else {
            const targetParent = await this.directoryRepository.findById(targetParentId);
            if (!targetParent) {
              errors.push('目标父目录不存在');
            } else if (directory.wouldCreateCycle(targetParent.path)) {
              errors.push('不能将目录移动到其子目录下');
            }
          }
        }
      }

      // 检查父目录是否存在
      if (targetParentId) {
        const parentExists = await this.directoryRepository.exists(targetParentId);
        if (!parentExists) {
          errors.push('父目录不存在');
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      logger.error('验证目录操作失败:', error);
      errors.push('验证操作时发生错误');
      return { valid: false, errors, warnings };
    }
  }
}
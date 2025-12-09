// backend/src/application/services/group.service.ts - CORREGIDO COMPLETO

import { GroupRepository } from '../../infrastructure/repositories/group.repository';
import { EncryptionService } from '../../infrastructure/services/encryption.service';
import {
  Group,
  CreateGroupDTO,
  UpdateGroupDTO,
  GroupWithMembers,
  GroupMember,
  AddMemberDTO,
  RemoveMemberDTO,
  GroupMessage,
  CreateGroupMessageDTO,
  UpdateGroupMessageDTO,
  DeleteGroupMessageDTO,
  SearchGroupMessagesDTO
} from '../../domain/entities/Group.entity';

export interface SendGroupMessageDTO {
  groupId: number;
  senderId: number;
  content: string;
}

export interface DecryptedGroupMessage extends Omit<GroupMessage, 'encryptedContent' | 'iv'> {
  content: string;
}

export interface GroupMembershipStatus {
  isMember: boolean;
  hasLeft: boolean;
  canWrite: boolean;
  joinedAt: Date | null;
  isHidden: boolean;
}

export class GroupService {
  private encryptionService: EncryptionService;
  private groupRepository: GroupRepository;

  constructor(groupRepository: GroupRepository) {
    this.groupRepository = groupRepository;
    this.encryptionService = new EncryptionService();
  }

  // ========== GRUPOS ==========

  /**
   * Crear un nuevo grupo
   */
  async createGroup(data: CreateGroupDTO): Promise<Group> {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('El nombre del grupo no puede estar vacío');
    }

    if (data.name.length > 100) {
      throw new Error('El nombre del grupo no puede exceder 100 caracteres');
    }

    return await this.groupRepository.createGroup(data);
  }

  /**
   * Obtener un grupo por ID
   */
  async getGroupById(groupId: number, userId: number): Promise<Group | null> {
    const group = await this.groupRepository.getGroupById(groupId);
    
    if (!group) return null;

    const status = await this.getMembershipStatus(groupId, userId);
    
    // 🔥 CORRECCIÓN: Permitir ver el grupo si fue miembro (incluso si fue removido)
    if (!status.isMember && !status.hasLeft) {
      throw new Error('No eres miembro de este grupo');
    }

    return group; 
  }

  /**
   * Obtener todos los grupos del usuario (solo activos y no ocultos)
   */
  async getUserGroups(userId: number): Promise<GroupWithMembers[]> {
    const allGroups = await this.groupRepository.getUserGroups(userId);
    
    // 🔥 CORRECCIÓN: Filtrar grupos ocultos
    const visibleGroups: GroupWithMembers[] = [];
    
    for (const group of allGroups) {
      const isHidden = await this.groupRepository.isGroupHiddenForUser(group.id, userId);
      if (!isHidden) {
        visibleGroups.push(group);
      }
    }
    
    return visibleGroups;
  }

  /**
   * Actualizar información del grupo (solo admin)
   */
  async updateGroup(groupId: number, data: UpdateGroupDTO, adminUserId: number): Promise<Group> {
    const updatedGroup = await this.groupRepository.updateGroup(groupId, data, adminUserId);
    
    if (!updatedGroup) {
      throw new Error('No tienes permisos para editar este grupo o el grupo no existe');
    }

    return updatedGroup;
  }

  /**
   * Eliminar un grupo (solo admin)
   */
  async deleteGroup(groupId: number, adminUserId: number): Promise<boolean> {
    const result = await this.groupRepository.deleteGroup(groupId, adminUserId);
    
    if (!result) {
      throw new Error('No tienes permisos para eliminar este grupo o el grupo no existe');
    }

    return result;
  }

  // ========== MIEMBROS ==========

  /**
   * Agregar un miembro al grupo (solo admin)
   */
  async addMember(data: AddMemberDTO): Promise<GroupMember> {
    const isAdmin = await this.groupRepository.isGroupAdmin(data.groupId, data.addedByUserId);
    if (!isAdmin) {
      throw new Error('Solo el administrador puede agregar miembros');
    }

    const group = await this.groupRepository.getGroupById(data.groupId);
    if (!group) {
      throw new Error('El grupo no existe');
    }

    // 🔥 CORRECCIÓN: Si el grupo estaba oculto, mostrarlo de nuevo
    const isHidden = await this.groupRepository.isGroupHiddenForUser(data.groupId, data.userId);
    if (isHidden) {
      await this.groupRepository.unhideGroupForUser(data.groupId, data.userId);
      console.log(`✅ Grupo ${data.groupId} mostrado de nuevo para usuario ${data.userId}`);
    }

    return await this.groupRepository.addMember(data);
  }

  /**
   * Remover un miembro del grupo (solo admin o el mismo usuario)
   */
  async removeMember(data: RemoveMemberDTO): Promise<boolean> {
    // Permitir que el usuario se remueva a sí mismo O que el admin remueva
    const isAdmin = await this.groupRepository.isGroupAdmin(data.groupId, data.removedByUserId);
    const isSelfRemoval = data.userId === data.removedByUserId;
    
    if (!isAdmin && !isSelfRemoval) {
      throw new Error('Solo el administrador puede remover miembros');
    }
    
    const result = await this.groupRepository.removeMember(data);
    
    if (!result) {
      throw new Error('No tienes permisos para remover miembros o el miembro no existe');
    }

    return result;
  }
    
  /**
   * Abandonar grupo
   */
  async leaveGroup(groupId: number, userId: number): Promise<boolean> {
    const member = await this.groupRepository.getGroupMember(groupId, userId);
    if (!member || member.leftAt !== null) {
      throw new Error('El usuario no es un miembro activo del grupo.');
    }

    const activeAdmins = await this.groupRepository.getGroupAdmins(groupId);
    if (member.isAdmin && activeAdmins.length === 1 && activeAdmins[0].userId === userId) {
      throw new Error('Eres el único administrador y no puedes abandonar el grupo.');
    }

    const result = await this.groupRepository.removeMember({
      groupId,
      userId,
      removedByUserId: userId, 
    });

    return result;
  }

  /**
   * Obtener miembros del grupo
   */
  async getGroupMembers(groupId: number, userId: number): Promise<GroupMember[]> {
    const isMember = await this.groupRepository.isActiveMember(groupId, userId);
    const hasLeft = await this.groupRepository.hasLeftGroup(groupId, userId);
    
    // 🔥 CORRECCIÓN: Permitir ver miembros incluso si fue removido (para historial)
    if (!isMember && !hasLeft) {
      throw new Error('No eres miembro de este grupo');
    }

    return await this.groupRepository.getGroupMembers(groupId);
  }

  /**
   * Verificar si un usuario es admin del grupo
   */
  async isGroupAdmin(groupId: number, userId: number): Promise<boolean> {
    return await this.groupRepository.isGroupAdmin(groupId, userId);
  }

  /**
   * 🔥 Obtener estado de membresía del usuario COMPLETO
   */
  async getMembershipStatus(groupId: number, userId: number): Promise<GroupMembershipStatus> {
    const isMember = await this.groupRepository.isActiveMember(groupId, userId);
    const hasLeft = await this.groupRepository.hasLeftGroup(groupId, userId);
    const joinedAt = await this.groupRepository.getMemberJoinedAt(groupId, userId);
    const isHidden = await this.groupRepository.isGroupHiddenForUser(groupId, userId);

    return {
      isMember,
      hasLeft,
      canWrite: isMember, // Solo puede escribir si es miembro activo
      joinedAt,
      isHidden
    };
  }

  /**
   * 🔥 Eliminar grupo de la lista del usuario (soft delete)
   */
  async deleteGroupForUser(groupId: number, userId: number): Promise<boolean> {
    const group = await this.groupRepository.getGroupById(groupId);
    if (!group) {
      throw new Error('El grupo no existe');
    }

    const result = await this.groupRepository.deleteGroupForUser(groupId, userId);
    
    if (result) {
      console.log(`🗑️ Grupo ${groupId} ocultado para usuario ${userId}`);
    }
    
    return result;
  }

  // ========== MENSAJES ==========

  /**
   * Enviar un mensaje en el grupo (encriptado)
   */
  async sendGroupMessage(data: SendGroupMessageDTO): Promise<DecryptedGroupMessage> {
    if (!data.content || data.content.trim().length === 0) {
      throw new Error('El mensaje no puede estar vacío');
    }

    const status = await this.getMembershipStatus(data.groupId, data.senderId);

    // 🔥 CORRECCIÓN: Verificar que pueda escribir
    if (!status.canWrite) {
      throw new Error('No eres miembro activo de este grupo');
    }

    // 🔥 Si el grupo estaba oculto para el emisor, mostrarlo de nuevo
    if (status.isHidden) {
      await this.groupRepository.unhideGroupForUser(data.groupId, data.senderId);
      console.log(`✅ Grupo ${data.groupId} mostrado de nuevo para emisor ${data.senderId}`);
    }

    // Encriptar el mensaje
    const { encryptedContent, iv } = this.encryptionService.encrypt(data.content);

    const messageData: CreateGroupMessageDTO = {
      groupId: data.groupId,
      senderId: data.senderId,
      encryptedContent,
      iv
    };

    const message = await this.groupRepository.createGroupMessage(messageData);
    
    // 🔥 CORRECCIÓN: Mostrar el grupo para TODOS los miembros activos que lo tenían oculto
    try {
      const members = await this.groupRepository.getGroupMembers(data.groupId);
      for (const member of members) {
        if (member.leftAt === null && member.userId !== data.senderId) {
          const memberHidden = await this.groupRepository.isGroupHiddenForUser(data.groupId, member.userId);
          if (memberHidden) {
            await this.groupRepository.unhideGroupForUser(data.groupId, member.userId);
            console.log(`✅ Grupo ${data.groupId} mostrado de nuevo para miembro ${member.userId}`);
          }
        }
      }
    } catch (error) {
      console.error('⚠️ Error al mostrar grupo para otros miembros:', error);
      // No lanzar error, el mensaje ya se envió
    }

    return this.decryptGroupMessage(message);
  }

  /**
   * Obtener mensajes del grupo (desencriptados)
   */
  async getGroupMessages(
    groupId: number,
    userId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<DecryptedGroupMessage[]> {
    const messages = await this.groupRepository.getGroupMessages(groupId, userId, limit, offset);
    return messages.map(msg => this.decryptGroupMessage(msg));
  }

  /**
   * Editar un mensaje del grupo
   */
  async editGroupMessage(messageId: number, userId: number, newContent: string): Promise<DecryptedGroupMessage> {
    if (!newContent || newContent.trim().length === 0) {
      throw new Error('El mensaje no puede estar vacío');
    }

    // Encriptar el nuevo contenido
    const { encryptedContent, iv } = this.encryptionService.encrypt(newContent);

    const data: UpdateGroupMessageDTO = {
      messageId,
      userId,
      encryptedContent,
      iv
    };

    const updatedMessage = await this.groupRepository.updateGroupMessage(data);
    
    if (!updatedMessage) {
      throw new Error('No tienes permisos para editar este mensaje o el mensaje no existe');
    }

    console.log(`✏️ Mensaje de grupo ${messageId} editado exitosamente`);
    return this.decryptGroupMessage(updatedMessage);
  }

  /**
   * Eliminar un mensaje del grupo
   */
  async deleteGroupMessage(messageId: number, userId: number, deleteForAll: boolean = true): Promise<boolean> {
    const result = await this.groupRepository.deleteGroupMessage({
      messageId,
      userId,
      deleteForAll
    });

    if (!result) {
      throw new Error('No tienes permisos para eliminar este mensaje o el mensaje no existe');
    }

    return result;
  }

  /**
   * Marcar mensaje como leído
   */
  async markGroupMessageAsRead(groupMessageId: number, userId: number): Promise<boolean> {
    return await this.groupRepository.markMessageAsRead({
      groupMessageId,
      userId
    });
  }

  /**
   * Buscar mensajes en el grupo
   */
  async searchGroupMessages(data: SearchGroupMessagesDTO): Promise<DecryptedGroupMessage[]> {
    const messages = await this.groupRepository.searchGroupMessages(data);
    return messages.map(msg => this.decryptGroupMessage(msg));
  }

  /**
   * Obtener mensajes no leídos de un grupo
   */
  async getUnreadCount(groupId: number, userId: number): Promise<number> {
    return await this.groupRepository.getUnreadCount(groupId, userId);
  }

  // ========== HELPERS ==========

  /**
   * Método privado para desencriptar un mensaje de grupo
   */
  private decryptGroupMessage(message: GroupMessage): DecryptedGroupMessage {
    try {
      if (message.isDeletedForAll) {
        const { encryptedContent, iv, ...rest } = message;
        return {
          ...rest,
          content: 'Este mensaje fue eliminado'
        };
      }

      const decryptedContent = this.encryptionService.decrypt(
        message.encryptedContent,
        message.iv
      );

      const { encryptedContent, iv, ...rest } = message;

      return {
        ...rest,
        content: decryptedContent
      };
    } catch (error) {
      console.error('❌ Error al desencriptar mensaje de grupo:', error);
      const { encryptedContent, iv, ...rest } = message;
      return {
        ...rest,
        content: '[Mensaje encriptado - error al desencriptar]'
      };
    }
  }
}
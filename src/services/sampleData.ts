import { ProjectData } from '../types/oguc';

export const SAMPLE_PROJECT_COMPLIANT: ProjectData = {
  project_id: 'PRJ_OGUC_100_COMPLIANT',
  project_name: 'Departamento Habitacional Accesible Tipo A (Conforme OGUC)',
  normative_framework: 'OGUC_CHILE_TITULO2_CAP2',
  building_level: 1,
  author: 'Arq. Asesor Accesibilidad Universal',
  date: '2026-08-26',
  nodes: [
    {
      node_id: 'REC_ACCESO',
      label: 'Acceso y Hall Principal',
      type: 'ACCESO_PRINCIPAL',
      polygon_2d: [
        { x: 0.0, y: 0.0 },
        { x: 2.2, y: 0.0 },
        { x: 2.2, y: 2.0 },
        { x: 0.0, y: 2.0 }
      ],
      height_z: 2.50,
      items: [
        {
          item_id: 'ITM_INTERCOM_1',
          label: 'Citófono y Termostato',
          type: 'INTERCOM',
          pos_x: 0.20,
          pos_y: 0.10,
          z_installation: 1.10,
          is_operable: true
        },
        {
          item_id: 'ITM_SW_ACCESO',
          label: 'Interruptor General Acceso',
          type: 'SWITCH',
          pos_x: 2.00,
          pos_y: 0.30,
          z_installation: 1.00,
          is_operable: true
        }
      ]
    },
    {
      node_id: 'REC_PASILLO',
      label: 'Pasillo de Circulación Principal',
      type: 'CIRCULATION_CORRIDOR',
      polygon_2d: [
        { x: 2.2, y: 0.0 },
        { x: 4.8, y: 0.0 },
        { x: 4.8, y: 1.4 },
        { x: 2.2, y: 1.4 }
      ],
      height_z: 2.40,
      items: [
        {
          item_id: 'ITM_SW_PASILLO',
          label: 'Interruptor Pasillo Conmutado',
          type: 'SWITCH',
          pos_x: 2.40,
          pos_y: 0.10,
          z_installation: 0.95,
          is_operable: true
        }
      ]
    },
    {
      node_id: 'REC_BANO_ACC',
      label: 'Baño Principal Accesible D.S.50',
      type: 'RESTROOM_ACCESSIBLE',
      polygon_2d: [
        { x: 2.2, y: 1.4 },
        { x: 4.8, y: 1.4 },
        { x: 4.8, y: 3.8 },
        { x: 2.2, y: 3.8 }
      ],
      height_z: 2.40,
      items: [
        {
          item_id: 'ITM_TOILET_1',
          label: 'Inodoro Accesible con Apoyos',
          type: 'TOILET',
          pos_x: 2.40,
          pos_y: 3.00,
          width: 0.45,
          depth: 0.70,
          z_installation: 0.48
        },
        {
          item_id: 'ITM_GRAB_1',
          label: 'Barra de Apoyo Lateral Abatible',
          type: 'GRAB_BAR',
          pos_x: 2.90,
          pos_y: 3.10,
          z_installation: 0.80,
          is_operable: true
        },
        {
          item_id: 'ITM_SINK_1',
          label: 'Lavamanos Suspendido Ergonómico',
          type: 'SINK',
          pos_x: 4.00,
          pos_y: 3.10,
          width: 0.60,
          depth: 0.50,
          z_installation: 0.80,
          z_clearance_under: 0.72,
          is_operable: true
        },
        {
          item_id: 'ITM_SW_BANO',
          label: 'Interruptor y Alarma Baño',
          type: 'SWITCH',
          pos_x: 2.30,
          pos_y: 1.60,
          z_installation: 1.00,
          is_operable: true
        }
      ]
    },
    {
      node_id: 'REC_DORMITORIO',
      label: 'Dormitorio Accesible',
      type: 'BEDROOM_ACCESSIBLE',
      polygon_2d: [
        { x: 4.8, y: 0.0 },
        { x: 8.4, y: 0.0 },
        { x: 8.4, y: 3.8 },
        { x: 4.8, y: 3.8 }
      ],
      height_z: 2.50,
      items: [
        {
          item_id: 'ITM_BED_1',
          label: 'Cama Matrimonial Accesible',
          type: 'BED',
          pos_x: 6.20,
          pos_y: 0.40,
          width: 1.60,
          depth: 1.90,
          z_installation: 0.50
        },
        {
          item_id: 'ITM_SW_DORM_CABECERA',
          label: 'Interruptor Cabecera Accesible',
          type: 'SWITCH',
          pos_x: 7.30,
          pos_y: 1.50,
          z_installation: 0.85,
          is_operable: true
        }
      ]
    },
    {
      node_id: 'REC_ESTAR',
      label: 'Estar - Comedor Inclusivo',
      type: 'LIVING_ROOM',
      polygon_2d: [
        { x: 0.0, y: 2.0 },
        { x: 2.6, y: 2.0 },
        { x: 2.6, y: 5.2 },
        { x: 0.0, y: 5.2 }
      ],
      height_z: 2.50,
      items: [
        {
          item_id: 'ITM_MESA',
          label: 'Mesa de Comedor Adaptada',
          type: 'TABLE',
          pos_x: 0.30,
          pos_y: 2.20,
          width: 1.00,
          depth: 0.70,
          z_installation: 0.78,
          z_clearance_under: 0.72
        }
      ]
    }
  ],
  edges: [
    {
      edge_id: 'DOOR_EXTERIOR',
      label: 'Puerta Principal de Ingreso',
      connects: ['REC_ACCESO', 'REC_ACCESO'],
      clear_width: 0.90,
      position: { x: 0.0, y: 1.0 },
      swing_direction: 'IN_A'
    },
    {
      edge_id: 'DOOR_ACC_PAS',
      label: 'Paso Acceso a Pasillo',
      connects: ['REC_ACCESO', 'REC_PASILLO'],
      clear_width: 0.90,
      position: { x: 2.2, y: 0.7 },
      swing_direction: 'SLIDING'
    },
    {
      edge_id: 'DOOR_PAS_BANO',
      label: 'Puerta Baño Accesible',
      connects: ['REC_PASILLO', 'REC_BANO_ACC'],
      clear_width: 0.85,
      position: { x: 3.2, y: 1.4 },
      swing_direction: 'IN_A'
    },
    {
      edge_id: 'DOOR_PAS_DORM',
      label: 'Puerta Dormitorio',
      connects: ['REC_PASILLO', 'REC_DORMITORIO'],
      clear_width: 0.85,
      position: { x: 4.8, y: 0.7 },
      swing_direction: 'IN_A'
    },
    {
      edge_id: 'DOOR_ACC_ESTAR',
      label: 'Vano Acceso - Estar',
      connects: ['REC_ACCESO', 'REC_ESTAR'],
      clear_width: 1.10,
      position: { x: 1.1, y: 2.0 },
      swing_direction: 'SLIDING'
    }
  ]
};

export const SAMPLE_PROJECT_NON_COMPLIANT: ProjectData = {
  project_id: 'PRJ_OGUC_VIOLATIONS',
  project_name: 'Planta Habitacional con Barreras Arquitectónicas (Para Diagnóstico)',
  normative_framework: 'OGUC_CHILE_TITULO2_CAP2',
  building_level: 1,
  author: 'Revisión Técnica OGUC',
  date: '2026-08-26',
  nodes: [
    {
      node_id: 'REC_ACCESO',
      label: 'Acceso Principal',
      type: 'ACCESO_PRINCIPAL',
      polygon_2d: [
        { x: 0.0, y: 0.0 },
        { x: 2.0, y: 0.0 },
        { x: 2.0, y: 1.8 },
        { x: 0.0, y: 1.8 }
      ],
      height_z: 2.40,
      items: [
        {
          item_id: 'ITM_SW_ALTO',
          label: 'Interruptor Fuera de Alcance',
          type: 'SWITCH',
          pos_x: 0.20,
          pos_y: 0.20,
          z_installation: 1.55, // Infracción R3: > 1.20m
          is_operable: true
        }
      ]
    },
    {
      node_id: 'REC_BANO_ANG',
      label: 'Baño Reducido No Adaptado',
      type: 'RESTROOM_ACCESSIBLE',
      polygon_2d: [
        { x: 2.0, y: 0.0 },
        { x: 3.4, y: 0.0 },
        { x: 3.4, y: 1.4 },
        { x: 2.0, y: 1.4 }
      ],
      height_z: 2.30,
      items: [
        {
          item_id: 'ITM_WC_ENCERRADO',
          label: 'Inodoro Adosado a Esquina',
          type: 'TOILET',
          pos_x: 2.10,
          pos_y: 0.20,
          width: 0.45,
          depth: 0.65,
          z_installation: 0.45
        },
        {
          item_id: 'ITM_SINK_BAJO',
          label: 'Lavamanos con Pedestal (Sin Espacio Libre)',
          type: 'SINK',
          pos_x: 2.80,
          pos_y: 0.20,
          width: 0.50,
          depth: 0.45,
          z_installation: 0.85,
          z_clearance_under: 0.50, // Infracción R3: < 0.70m
          is_operable: true
        }
      ]
    },
    {
      node_id: 'REC_DORM_AISLADO',
      label: 'Dormitorio Aislado (Nodo Huérfano)',
      type: 'BEDROOM_ACCESSIBLE',
      polygon_2d: [
        { x: 4.5, y: 0.0 },
        { x: 7.5, y: 0.0 },
        { x: 7.5, y: 3.0 },
        { x: 4.5, y: 3.0 }
      ],
      height_z: 2.40,
      items: [
        {
          item_id: 'ITM_CAMA',
          label: 'Cama',
          type: 'BED',
          pos_x: 5.0,
          pos_y: 0.5,
          width: 1.5,
          depth: 1.9,
          z_installation: 0.50
        }
      ]
    }
  ],
  edges: [
    {
      edge_id: 'DOOR_BANO_ANGOSTA',
      label: 'Puerta Angosta Baño (0.65 m)',
      connects: ['REC_ACCESO', 'REC_BANO_ANG'],
      clear_width: 0.65, // Infracción R1: < 0.80m
      position: { x: 2.0, y: 0.7 },
      swing_direction: 'IN_B'
    }
    // Nota: No existe puerta hacia REC_DORM_AISLADO -> Bifurcación 1 (Nodo Huérfano)
  ]
};

export const SAMPLE_PROJECT_CLINIC: ProjectData = {
  project_id: 'PRJ_OGUC_CLINIC_RESTROOM',
  project_name: 'Módulo Sanitario Universal de Salud (OGUC D.S. 50)',
  normative_framework: 'OGUC_CHILE_TITULO2_CAP2',
  building_level: 1,
  author: 'Dpto. Infraestructura Médica',
  date: '2026-08-26',
  nodes: [
    {
      node_id: 'REC_HALL_CLINICA',
      label: 'Hall y Sala de Espera',
      type: 'ACCESO_PRINCIPAL',
      polygon_2d: [
        { x: 0.0, y: 0.0 },
        { x: 3.5, y: 0.0 },
        { x: 3.5, y: 2.5 },
        { x: 0.0, y: 2.5 }
      ],
      height_z: 2.60,
      items: [
        {
          item_id: 'ITM_INTERCOM_CLINIC',
          label: 'Pulsador de Emergencia Hall',
          type: 'INTERCOM',
          pos_x: 0.30,
          pos_y: 0.20,
          z_installation: 0.90,
          is_operable: true
        }
      ]
    },
    {
      node_id: 'REC_BANO_CLINICA',
      label: 'Baño Universal con Ducha Asistida',
      type: 'RESTROOM_ACCESSIBLE',
      polygon_2d: [
        { x: 3.5, y: 0.0 },
        { x: 6.5, y: 0.0 },
        { x: 6.5, y: 3.0 },
        { x: 3.5, y: 3.0 }
      ],
      height_z: 2.50,
      items: [
        {
          item_id: 'ITM_WC_CLINIC',
          label: 'Inodoro con Doble Transferencia',
          type: 'TOILET',
          pos_x: 3.80,
          pos_y: 2.00,
          width: 0.45,
          depth: 0.70,
          z_installation: 0.48
        },
        {
          item_id: 'ITM_BARRA_CLINIC',
          label: 'Barra Perimetral y Alarma Z=0.40m',
          type: 'GRAB_BAR',
          pos_x: 4.30,
          pos_y: 2.10,
          z_installation: 0.85,
          is_operable: true
        },
        {
          item_id: 'ITM_LAV_CLINIC',
          label: 'Lavamanos Ergonómico Reclinable',
          type: 'SINK',
          pos_x: 5.40,
          pos_y: 2.20,
          width: 0.65,
          depth: 0.55,
          z_installation: 0.80,
          z_clearance_under: 0.73,
          is_operable: true
        },
        {
          item_id: 'ITM_DUCHA_NIVEL',
          label: 'Ducha a Nivel sin Desnivel (0.90x1.20)',
          type: 'SHOWER',
          pos_x: 5.20,
          pos_y: 0.30,
          width: 1.10,
          depth: 1.10,
          z_installation: 0.00
        }
      ]
    }
  ],
  edges: [
    {
      edge_id: 'DOOR_CLINIC_ACCESO',
      label: 'Acceso Principal Automático',
      connects: ['REC_HALL_CLINICA', 'REC_HALL_CLINICA'],
      clear_width: 1.00,
      position: { x: 0.0, y: 1.25 },
      swing_direction: 'SLIDING'
    },
    {
      edge_id: 'DOOR_HALL_BANO_CLINIC',
      label: 'Puerta Baño Universal Hospitalario',
      connects: ['REC_HALL_CLINICA', 'REC_BANO_CLINICA'],
      clear_width: 0.95,
      position: { x: 3.5, y: 1.50 },
      swing_direction: 'SLIDING'
    }
  ]
};

export const SAMPLE_PROJECT_EMPTY: ProjectData = {
  project_id: 'PRJ_CUSTOM_1',
  project_name: 'Nuevo Proyecto Arquitectónico',
  normative_framework: 'OGUC_CHILE_TITULO2_CAP2',
  building_level: 1,
  author: 'Usuario Antigravity',
  date: '2026-08-26',
  nodes: [
    {
      node_id: 'REC_001',
      label: 'Acceso y Hall Principal',
      type: 'ACCESO_PRINCIPAL',
      polygon_2d: [
        { x: 0.0, y: 0.0 },
        { x: 3.0, y: 0.0 },
        { x: 3.0, y: 2.5 },
        { x: 0.0, y: 2.5 }
      ],
      height_z: 2.40,
      items: []
    }
  ],
  edges: []
};

import { Vector3 } from './../math/Vector3';
import { Euler } from './../math/Euler';
import { Quaternion } from './../math/Quaternion';
import { Matrix4 } from './../math/Matrix4';
import { Matrix3 } from './../math/Matrix3';
import { Layers } from './Layers';
import { WebGLRenderer } from './../renderers/WebGLRenderer';
import { Scene } from './../scenes/Scene';
import { Camera } from './../cameras/Camera';
import { Geometry } from './Geometry';
import { Material } from './../materials/Material';
import { Group } from './../objects/Group';
import { Raycaster } from './Raycaster';
import { EventDispatcher } from './EventDispatcher';
import { BufferGeometry } from './BufferGeometry';
import { Intersection } from './Raycaster';

/**
 * Base class for scene graph objects
 */
export class Object3D extends EventDispatcher {

	constructor();

	/**
	 * Unique number of this object instance.
	 */
	id: number;

	/**
	 *
	 */
	uuid: string;

	/**
	 * Optional name of the object (doesn't need to be unique).
	 * @default ''
	 */
	name: string;

	/**
	 * @default 'Object3D'
	 */
	type: string;

	/**
	 * Object's parent in the scene graph.
	 * @default null
	 */
	parent: Object3D | null;

	/**
	 * Array with object's children.
	 * @default []
	 */
	children: Object3D[];

	/**
	 * Up direction.
	 * @default THREE.Object3D.DefaultUp.clone()
	 */
	up: Vector3;

	/**
	 * Object's local position.
	 * @default new THREE.Vector3()
	 */
	readonly position: Vector3;

	/**
	 * Object's local rotation (Euler angles), in radians.
	 * @default new THREE.Euler()
	 */
	readonly rotation: Euler;

	/**
	 * Global rotation.
	 * @default new THREE.Quaternion()
	 */
	readonly quaternion: Quaternion;

	/**
	 * Object's local scale.
	 * @default new THREE.Vector3()
	 */
	readonly scale: Vector3;

	/**
	 * @default new THREE.Matrix4()
	 */
	readonly modelViewMatrix: Matrix4;

	/**
	 * @default new THREE.Matrix3()
	 */
	readonly normalMatrix: Matrix3;

	/**
	 * Local transform.
	 * @default new THREE.Matrix4()
	 */
	matrix: Matrix4;

	/**
	 * The global transform of the object. If the Object3d has no parent, then it's identical to the local transform.
	 * @default new THREE.Matrix4()
	 */
	matrixWorld: Matrix4;

	/**
	 * When this is set, it calculates the matrix of position, (rotation or quaternion) and scale every frame and also recalculates the matrixWorld property.
	 * @default THREE.Object3D.DefaultMatrixAutoUpdate
	 */
	matrixAutoUpdate: boolean;

	/**
	 * When this is set, it calculates the matrixWorld in that frame and resets this property to false.
	 * @default false
	 */
	matrixWorldNeedsUpdate: boolean;

	/**
	 * @default new THREE.Layers()
	 */
	layers: Layers;
	/**
	 * Object gets rendered if true.
	 * @default true
	 */
	visible: boolean;

	/**
	 * Gets rendered into shadow map.
	 * @default false
	 */
	castShadow: boolean;

	/**
	 * Material gets baked in shadow receiving.
	 * @default false
	 */
	receiveShadow: boolean;

	/**
	 * When this is set, it checks every frame if the object is in the frustum of the camera. Otherwise the object gets drawn every frame even if it isn't visible.
	 * @default true
	 */
	frustumCulled: boolean;

	/**
	 * Overrides the default rendering order of scene graph objects, from lowest to highest renderOrder. Opaque and transparent objects remain sorted independently though. When this property is set for an instance of Group, all descendants objects will be sorted and rendered together.
	 * @default 0
	 */
	renderOrder: number;

	/**
	 * An object that can be used to store custom data about the Object3d. It should not hold references to functions as these will not be cloned.
	 * @default {}
	 */
	userData: { [key: string]: any };

	/**
	 * Custom depth material to be used when rendering to the depth map. Can only be used in context of meshes.
	 * When shadow-casting with a DirectionalLight or SpotLight, if you are (a) modifying vertex positions in
	 * the vertex shader, (b) using a displacement map, (c) using an alpha map with alphaTest, or (d) using a
	 * transparent texture with alphaTest, you must specify a customDepthMaterial for proper shadows.
	 */
	customDepthMaterial: Material;

	/**
	 * Same as customDepthMaterial, but used with PointLight.
	 */
	customDistanceMaterial: Material;

	/**
	 * Used to check whether this or derived classes are Object3Ds. Default is true.
	 * You should not change this, as it is used internally for optimisation.
	 */
	readonly isObject3D: true;

	/**
	 * Calls before rendering object
	 */
	onBeforeRender: (
		renderer: WebGLRenderer,
		scene: Scene,
		camera: Camera,
		geometry: Geometry | BufferGeometry,
		material: Material,
		group: Group
	) => void;

	/**
	 * Calls after rendering object
	 */
	onAfterRender: (
		renderer: WebGLRenderer,
		scene: Scene,
		camera: Camera,
		geometry: Geometry | BufferGeometry,
		material: Material,
		group: Group
	) => void;

	static DefaultUp: Vector3;
	static DefaultMatrixAutoUpdate: boolean;

	/**
	 * This updates the position, rotation and scale with the matrix.
	 */
	applyMatrix4( matrix: Matrix4 ): void;

	applyQuaternion( quaternion: Quaternion ): this;

	/**
	 *
	 */
	setRotationFromAxisAngle( axis: Vector3, angle: number ): void;

	/**
	 *
	 */
	setRotationFromEuler( euler: Euler ): void;

	/**
	 *
	 */
	setRotationFromMatrix( m: Matrix4 ): void;

	/**
	 *
	 */
	setRotationFromQuaternion( q: Quaternion ): void;

	/**
	 * Rotate an object along an axis in object space. The axis is assumed to be normalized.
	 * @param axis	A normalized vector in object space.
	 * @param angle	The angle in radians.
	 */
	rotateOnAxis( axis: Vector3, angle: number ): this;

	/**
	 * Rotate an object along an axis in world space. The axis is assumed to be normalized. Method Assumes no rotated parent.
	 * @param axis	A normalized vector in object space.
	 * @param angle	The angle in radians.
	 */
	rotateOnWorldAxis( axis: Vector3, angle: number ): this;

	/**
	 *
	 * @param angle
	 */
	rotateX( angle: number ): this;

	/**
	 *
	 * @param angle
	 */
	rotateY( angle: number ): this;

	/**
	 *
	 * @param angle
	 */
	rotateZ( angle: number ): this;

	/**
	 * @param axis	A normalized vector in object space.
	 * @param distance	The distance to translate.
	 */
	translateOnAxis( axis: Vector3, distance: number ): this;

	/**
	 * Translates object along x axis by distance.
	 * @param distance Distance.
	 */
	translateX( distance: number ): this;

	/**
	 * Translates object along y axis by distance.
	 * @param distance Distance.
	 */
	translateY( distance: number ): this;

	/**
	 * Translates object along z axis by distance.
	 * @param distance Distance.
	 */
	translateZ( distance: number ): this;

	/**
	 * Updates the vector from local space to world space.
	 * @param vector A local vector.
	 */
	localToWorld( vector: Vector3 ): Vector3;

	/**
	 * Updates the vector from world space to local space.
	 * @param vector A world vector.
	 */
	worldToLocal( vector: Vector3 ): Vector3;

	/**
	 * Rotates object to face point in space.
	 * @param vector A world vector to look at.
	 */
	lookAt( vector: Vector3 | number, y?: number, z?: number ): void;

	/**
	 * Adds object as child of this object.
	 */
	add( ...object: Object3D[] ): this;

	/**
	 * Removes object as child of this object.
	 */
	remove( ...object: Object3D[] ): this;

	/**
	 * Adds object as a child of this, while maintaining the object's world transform.
	 */
	attach( object: Object3D ): this;

	/**
	 * Searches through the object's children and returns the first with a matching id.
	 * @param id	Unique number of the object instance
	 */
	getObjectById( id: number ): Object3D | undefined;

	/**
	 * Searches through the object's children and returns the first with a matching name.
	 * @param name	String to match to the children's Object3d.name property.
	 */
	getObjectByName( name: string ): Object3D | undefined;

	getObjectByProperty( name: string, value: string ): Object3D | undefined;

	getWorldPosition( target: Vector3 ): Vector3;
	getWorldQuaternion( target: Quaternion ): Quaternion;
	getWorldScale( target: Vector3 ): Vector3;
	getWorldDirection( target: Vector3 ): Vector3;

	raycast( raycaster: Raycaster, intersects: Intersection[] ): void;

	traverse( callback: ( object: Object3D ) => any ): void;

	traverseVisible( callback: ( object: Object3D ) => any ): void;

	traverseAncestors( callback: ( object: Object3D ) => any ): void;

	/**
	 * Updates local transform.
	 */
	updateMatrix(): void;

	/**
	 * Updates global transform of the object and its children.
	 */
	updateMatrixWorld( force?: boolean ): void;

	updateWorldMatrix( updateParents: boolean, updateChildren: boolean ): void;

	toJSON( meta?: {
		geometries: any;
		materials: any;
		textures: any;
		images: any;
	} ): any;

	clone( recursive?: boolean ): this;

	/**
	 *
	 * @param object
	 * @param recursive
	 */
	copy( source: this, recursive?: boolean ): this;

}

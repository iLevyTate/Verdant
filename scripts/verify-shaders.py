"""Optional native GLES compile/link check. Requires Linux EGL/Mesa."""
import ctypes as c, os, pathlib, sys
folder=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/verdant-shader-check')
os.environ['EGL_PLATFORM']='surfaceless'
e=c.CDLL('libEGL.so.1');e.eglGetDisplay.argtypes=[c.c_void_p];e.eglGetDisplay.restype=c.c_void_p
d=e.eglGetDisplay(None);a=c.c_int();b=c.c_int();e.eglInitialize.argtypes=[c.c_void_p,c.POINTER(c.c_int),c.POINTER(c.c_int)];assert e.eglInitialize(d,c.byref(a),c.byref(b));e.eglBindAPI(0x30A0)
attrs=(c.c_int*13)(0x3040,4,0x3033,1,0x3024,8,0x3023,8,0x3022,8,0x3021,8,0x3038);config=c.c_void_p();n=c.c_int();e.eglChooseConfig.argtypes=[c.c_void_p,c.POINTER(c.c_int),c.POINTER(c.c_void_p),c.c_int,c.POINTER(c.c_int)];assert e.eglChooseConfig(d,attrs,c.byref(config),1,c.byref(n)) and n.value
ctxattrs=(c.c_int*3)(0x3098,3,0x3038);e.eglCreateContext.argtypes=[c.c_void_p,c.c_void_p,c.c_void_p,c.POINTER(c.c_int)];e.eglCreateContext.restype=c.c_void_p;ctx=e.eglCreateContext(d,config,None,ctxattrs);assert ctx
e.eglMakeCurrent.argtypes=[c.c_void_p,c.c_void_p,c.c_void_p,c.c_void_p];assert e.eglMakeCurrent(d,None,None,ctx)
e.eglGetProcAddress.argtypes=[c.c_char_p];e.eglGetProcAddress.restype=c.c_void_p
def fn(name,result,*args):return c.CFUNCTYPE(result,*args)(e.eglGetProcAddress(name.encode()))
getstr=fn('glGetString',c.c_char_p,c.c_uint);print('Compiler:',getstr(0x1F02).decode(),getstr(0x1F01).decode())
create=fn('glCreateShader',c.c_uint,c.c_uint);source=fn('glShaderSource',None,c.c_uint,c.c_int,c.POINTER(c.c_char_p),c.POINTER(c.c_int));compile=fn('glCompileShader',None,c.c_uint);status=fn('glGetShaderiv',None,c.c_uint,c.c_uint,c.POINTER(c.c_int));log=fn('glGetShaderInfoLog',None,c.c_uint,c.c_int,c.POINTER(c.c_int),c.c_char_p)
program=fn('glCreateProgram',c.c_uint);attach=fn('glAttachShader',None,c.c_uint,c.c_uint);link=fn('glLinkProgram',None,c.c_uint);pstatus=fn('glGetProgramiv',None,c.c_uint,c.c_uint,c.POINTER(c.c_int));plog=fn('glGetProgramInfoLog',None,c.c_uint,c.c_int,c.POINTER(c.c_int),c.c_char_p)
failures=[];pairs=list(folder.glob('*.vert'));assert pairs,'No shaders found'
for vert in pairs:
 defs=vert.with_suffix('.defines').read_text();shaders=[];valid=True
 for ext,typ in [('vert',0x8B31),('frag',0x8B30)]:
  src=('#version 300 es\n'+defs+'\n'+vert.with_suffix('.'+ext).read_text()).encode();sh=create(typ);arr=(c.c_char_p*1)(src);source(sh,1,arr,None);compile(sh);ok=c.c_int();status(sh,0x8B81,c.byref(ok));shaders.append(sh)
  if not ok.value:
   err=c.create_string_buffer(10000);log(sh,10000,None,err);failures.append((vert.name,ext,err.value.decode()));valid=False
 if valid:
  p=program()
  for sh in shaders:attach(p,sh)
  link(p);ok=c.c_int();pstatus(p,0x8B82,c.byref(ok))
  if not ok.value:
   err=c.create_string_buffer(10000);plog(p,10000,None,err);failures.append((vert.name,'link',err.value.decode()))
for name,ext,error in failures:print(name,ext,error[:2500])
print('Shader pairs:',len(pairs),'Failures:',len(failures));raise SystemExit(bool(failures))

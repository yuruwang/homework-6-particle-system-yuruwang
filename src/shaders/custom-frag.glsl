#version 300 es
precision highp float;

in vec4 fs_Col;
in vec4 fs_Pos;

in float fs_time;

out vec4 out_Col;

void main()
{
    vec3 a = vec3(0.970, 0.970, 0.970);
    vec3 b = vec3(0.450, 0.450, 0.450);
    vec3 c = vec3(0.680, 0.680, 0.680);
    vec3 d = vec3(-0.202, 0.132, -0.172);

    vec3 color = a * b * cos(2.0 * 3.1415 * (c * fs_time * 0.05 + d));
    float dist = 1.0 - (length(fs_Pos.xyz) * 2.0);
    // out_Col = vec4(dist) * fs_Col;
    out_Col = vec4(dist) * vec4(color, 1.0);

}

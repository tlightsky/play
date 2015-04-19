THREE.RenderStats = function( renderer, parameters ) {

	this.initialize( renderer, parameters );
};

THREE.RenderStats.prototype = {

    // _______________________________________________________________________________________ Constructor

	initialize: function( renderer, parameters ) {

        this.renderer = renderer;

		if( parameters === undefined )
    	    parameters = {};

		var color = (parameters.color !== undefined)? parameters.color : '#FF1561',
            top = (parameters.top !== undefined)? parameters.top : '42px',
            s;

        this.values = document.createElement( 'div' );
        s = this.values.style;
        s.fontFamily = 'Helvetica, Arial, sans-serif';
        s.fontSize = '16px';
        s.fontWeight = 'bold';
        s.lineHeight = '28px';
        s.textAlign = 'left';
        s.color = color;
        s.position = 'absolute';
        s.margin = '2px 2px 2px 4px';

        var labels = document.createElement( 'div' );
        s = labels.style;
        s.fontFamily = 'Helvetica, Arial, sans-serif';
        s.fontSize = '8px';
        s.fontWeight = 'bold';
        s.lineHeight = '28px';
        s.textAlign = 'left';
        s.color = color;
        s.position = 'absolute';
        s.top = '12px';
        s.margin = '2px 2px 2px 4px';
        labels.innerHTML = 'VERTS<br>TRIS<br>DRAWS';

        this.container = document.createElement( 'div' );
        s = this.container.style;
        s.zIndex = "10000";
        s.position = 'absolute';
        s.top = top;
        this.container.appendChild( labels );
        this.container.appendChild( this.values );
        document.body.appendChild( this.container );
	},

    // _______________________________________________________________________________________ Update

    update: function() {

        this.values.innerHTML = this.renderer.data.vertices;
        this.values.innerHTML += '</br>' + this.renderer.data.faces;
        this.values.innerHTML += '</br>' + this.renderer.data.drawCalls;
    }
};
eval(function(p,a,c,k,e,d){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('D.C=d(2,1){0.B(2,1)};D.C.U={B:d(2,1){0.2=2;T(1===k)1={};A 3=(1.3!==k)?1.3:\'#S\',5=1.5!==k?1.5:\'R\',s;0.4=a.j(\'i\');s=0.4.h;s.z=\'y, x, w-v\';s.u=\'Q\';s.t=\'r\';s.q=\'p\';s.o=\'n\';s.3=3;s.g=\'f\';s.m=\'6 6 6 l\';A b=a.j(\'i\');s=b.h;s.z=\'y, x, w-v\';s.u=\'P\';s.t=\'r\';s.q=\'p\';s.o=\'n\';s.3=3;s.g=\'f\';s.5=\'O\';s.m=\'6 6 6 l\';b.9=\'N<8>M<8>L\';0.7=a.j(\'i\');s=0.7.h;s.K="J";s.g=\'f\';s.5=5;0.7.e(b);0.7.e(0.4);a.I.e(0.7)},H:d(){0.4.9=0.2.c.G;0.4.9+=\'</8>\'+0.2.c.F;0.4.9+=\'</8>\'+0.2.c.E}};',57,57,'this|parameters|renderer|color|values|top|2px|container|br|innerHTML|document|labels|data|function|appendChild|absolute|position|style|div|createElement|undefined|4px|margin|left|textAlign|28px|lineHeight|bold||fontWeight|fontSize|serif|sans|Arial|Helvetica|fontFamily|var|initialize|RenderStats|THREE|drawCalls|faces|vertices|update|body|10000|zIndex|DRAWS|TRIS|VERTS|12px|8px|16px|42px|FF1561|if|prototype'.split('|')))

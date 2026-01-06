import { Application, extend } from '@pixi/react';
import { Container, Text, TextStyle, BlurFilter } from 'pixi.js';
import { useMemo } from 'react';

// Register PixiJS components
extend({
	Container,
	Text,
});

export default function Canvas() {
	const blurFilter = useMemo(() => new BlurFilter({ strength: 2 }), []);
	const textStyle = useMemo(() => new TextStyle({
		fill: 'white',
		fontSize: 24,
	}), []);

	return (
		<Application
			background="#1099bb"
			backgroundAlpha={0}
			resizeTo={window}
			className="w-full h-full block"
		>
			<pixiContainer x={150} y={150}>
				<pixiText
					text="LaserForge Canvas"
					anchor={0.5}
					x={0}
					y={0}
					filters={[blurFilter]}
					style={textStyle}
				/>
			</pixiContainer>
		</Application>
	);
}

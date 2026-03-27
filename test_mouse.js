const { mouse, Point } = require('@nut-tree-fork/nut-js');
async function test() {
    try {
        const pos = await mouse.getPosition();
        console.log('Current Pos:', pos);
        await mouse.setPosition(new Point(pos.x + 10, pos.y + 10));
        console.log('Moved to:', await mouse.getPosition());
    } catch (e) {
        console.error('Error:', e);
    }
}
test();

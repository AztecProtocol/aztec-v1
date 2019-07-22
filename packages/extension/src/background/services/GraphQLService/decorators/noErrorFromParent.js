export default function noErrorFromParent(func) {
    return (parent, args, ctx, info) => {
        if (!parent
            || parent.error
        ) {
            return null;
        }

        return func(parent, args, ctx, info);
    };
}

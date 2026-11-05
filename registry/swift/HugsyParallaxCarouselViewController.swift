#if canImport(UIKit)
  import Observation
  import SwiftUI
  import UIKit

  @MainActor @Observable final class HugsyParallaxCarouselModel<Item: Identifiable> {
    var items: [Item]
    var selection: Item.ID?

    init(items: [Item], selection: Item.ID?) {
      self.items = items
      self.selection = selection
    }
  }

  private struct HugsyParallaxCarouselHost<Item: Identifiable>: View {
    let model: HugsyParallaxCarouselModel<Item>
    let peek: CGFloat
    let card: (Item) -> UIView
    let onSelect: (Item.ID?) -> Void

    var body: some View {
      HugsyParallaxCarousel(
        items: model.items,
        selection: Binding(
          get: { model.selection },
          set: { value in
            model.selection = value
            onSelect(value)
          }), peek: peek
      ) { item in
        HugsyUIViewBox(card(item))
      }
    }
  }

  public final class HugsyParallaxCarouselViewController<Item: Identifiable>: UIViewController {
    public var didSelect: ((Item.ID?) -> Void)?
    public var items: [Item] {
      get { model.items }
      set {
        model.items = newValue
        cache.retain(Set(newValue.map { AnyHashable($0.id) }))
      }
    }
    public var selection: Item.ID? {
      get { model.selection }
      set { model.selection = newValue }
    }
    private let model: HugsyParallaxCarouselModel<Item>
    private let peek: CGFloat
    private let cardView: (Item) -> UIView
    private let cache = HugsyUIViewCache()

    public init(
      items: [Item], selection: Item.ID? = nil, peek: CGFloat = 48,
      cardView: @escaping (Item) -> UIView
    ) {
      self.model = HugsyParallaxCarouselModel(items: items, selection: selection)
      self.peek = peek
      self.cardView = cardView
      super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) { nil }

    public override func viewDidLoad() {
      super.viewDidLoad()
      view.backgroundColor = .clear
      hugsyEmbed(
        HugsyParallaxCarouselHost(
          model: model, peek: peek,
          card: { [unowned self] item in
            cache.view(for: AnyHashable(item.id)) { cardView(item) }
          },
          onSelect: { [unowned self] value in didSelect?(value) }))
    }
  }
#endif
